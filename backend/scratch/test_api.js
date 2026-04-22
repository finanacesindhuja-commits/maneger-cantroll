const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getCenters() {
    const { data: pdData } = await supabase
      .from('pd_verifications')
      .select('member_id')
      .or('status.ilike.APPROVED,pd_verified.eq.true');
    const approvedMemberIds = (pdData || []).map(pd => pd.member_id).filter(Boolean);

    console.log("Approved member IDs:", approvedMemberIds);

    const { data: regularLoans, error: loanError } = await supabase
      .from('loans')
      .select('center_id, status, amount_sanctioned, member_id')
      .in('status', ['APPROVED', 'SANCTIONED', 'CREDITED']);

    let readyLoans = [];
    if (approvedMemberIds.length > 0) {
      const { data: rLoans } = await supabase
        .from('loans')
        .select('center_id, status, amount_sanctioned, member_id')
        .eq('status', 'READY FOR PD')
        .in('member_id', approvedMemberIds);
      if (rLoans) readyLoans = rLoans;
    }

    const activeLoans = [...(regularLoans || []), ...readyLoans];
    console.log("Active loans length:", activeLoans.length);

    if (!activeLoans || activeLoans.length === 0) {
      return console.log("Empty centers returned!");
    }

    const readyCenterIds = [...new Set(activeLoans.map(l => l.center_id))].filter(Boolean);
    console.log("Ready Center IDs:", readyCenterIds);

    const { data: centers } = await supabase
      .from('centers')
      .select('*')
      .in('id', readyCenterIds);

    const enrichedCenters = centers.map(c => {
      const centerLoans = activeLoans.filter(l => l.center_id === c.id);
      const hasCredited = centerLoans.some(l => l.status === 'CREDITED');
      const hasSanctioned = centerLoans.some(l => l.status === 'SANCTIONED');
      const hasApproved = centerLoans.some(l => l.status === 'APPROVED' || l.status === 'READY FOR PD');

      return { 
        id: c.id,
        name: c.name,
        canSanction: hasApproved,
        hasCredited,
        isWaitingCredit: hasSanctioned && !hasCredited,
        membersCount: centerLoans.length
      };
    });
    
    console.log(enrichedCenters);
}
getCenters();
