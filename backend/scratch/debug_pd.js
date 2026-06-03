require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  try {
    console.log("=== Debugging Centers and PD Status ===");
    
    // 1. Fetch all pd_verifications
    const { data: pdData, error: pdErr } = await supabase
      .from('pd_verifications')
      .select('*');
    if (pdErr) throw pdErr;
    console.log(`Total pd_verifications: ${pdData.length}`);
    console.log("Sample pd_verifications status:", pdData.map(p => ({ member_id: p.member_id, status: p.status, verified: p.pd_verified })));

    // 2. Fetch all loans
    const { data: loans, error: loanErr } = await supabase
      .from('loans')
      .select('*');
    if (loanErr) throw loanErr;
    console.log(`Total loans: ${loans.length}`);
    console.log("Sample loans status:", loans.map(l => ({ id: l.id, center_id: l.center_id, member_id: l.member_id, status: l.status })));

    // 3. Fetch all members
    const { data: members, error: memErr } = await supabase
      .from('members')
      .select('*');
    if (memErr) throw memErr;
    console.log(`Total members: ${members.length}`);

    // 4. Fetch all centers
    const { data: centers, error: centerErr } = await supabase
      .from('centers')
      .select('*');
    if (centerErr) throw centerErr;

    // Check each center's breakdown
    for (const c of centers) {
      const centerLoans = loans.filter(l => l.center_id === c.id);
      const centerMembers = members.filter(m => m.center_id === c.id);
      
      const approvedVerifications = pdData.filter(pd => 
        (String(pd.status).toUpperCase() === 'APPROVED' || pd.pd_verified === true)
      );
      const approvedMemberIds = approvedVerifications.map(pd => pd.member_id);

      const approvedMembersInCenter = centerMembers.filter(m => 
        approvedMemberIds.some(aid => String(aid) === String(m.id))
      );

      const isPDComplete = centerMembers.length > 0 && approvedMembersInCenter.length === centerMembers.length;
      const activeLoansCount = centerLoans.filter(l => 
        ['APPROVED', 'READY FOR PD', 'SANCTIONED', 'CREDITED', 'DISBURSED'].includes(l.status)
      ).length;

      const isReadyForPd = centerLoans.some(l => l.status === 'READY FOR PD');
      const isApproved = centerLoans.some(l => l.status === 'APPROVED');
      const canSanction = isPDComplete && (isApproved || isReadyForPd);

      console.log(`\nCenter ID: ${c.id}, Name: ${c.name}`);
      console.log(`- Total members in DB: ${centerMembers.length}`);
      console.log(`- Approved members in DB: ${approvedMembersInCenter.length} (IDs: ${approvedMembersInCenter.map(m => m.id).join(', ')})`);
      console.log(`- Loans: ${centerLoans.length} (Active: ${activeLoansCount})`);
      console.log(`- isPDComplete: ${isPDComplete}`);
      console.log(`- isApproved: ${isApproved}, isReadyForPd: ${isReadyForPd}`);
      console.log(`- canSanction: ${canSanction}`);
      if (centerLoans.length > 0) {
        console.log("  Loans status for center:", centerLoans.map(l => ({ id: l.id, member_id: l.member_id, status: l.status })));
      }
    }
  } catch (err) {
    console.error("Error debugging:", err);
  }
}

run();
