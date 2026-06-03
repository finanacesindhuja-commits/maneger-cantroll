require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  try {
    const [pdRes, loansRes, membersRes, centersRes] = await Promise.all([
      supabase.from('pd_verifications').select('*'),
      supabase.from('loans').select('*'),
      supabase.from('members').select('*'),
      supabase.from('centers').select('*')
    ]);

    const pdData = pdRes.data || [];
    const loans = loansRes.data || [];
    const members = membersRes.data || [];
    const centers = centersRes.data || [];

    const approvedPDs = pdData.filter(pd => 
      (String(pd.status).toUpperCase() === 'APPROVED' || pd.pd_verified === true)
    );
    const approvedMemberSet = new Set(approvedPDs.map(p => String(p.member_id)));

    console.log("Approved member IDs in PD:", Array.from(approvedMemberSet));

    for (const c of centers) {
      const centerMembers = members.filter(m => String(m.center_id) === String(c.id));
      const centerLoans = loans.filter(l => String(l.center_id) === String(c.id));
      
      const pendingLoans = centerLoans.filter(l => 
        ['READY FOR PD', 'APPROVED'].includes(l.status)
      );

      if (pendingLoans.length === 0) continue; // No pending sanction work for this center

      const approvedPendingLoans = pendingLoans.filter(l => 
        approvedMemberSet.has(String(l.member_id))
      );

      const oldPDComplete = centerMembers.length > 0 && 
        centerMembers.every(m => approvedMemberSet.has(String(m.id)));

      const newPDComplete = pendingLoans.every(l => approvedMemberSet.has(String(l.member_id)));

      console.log(`\nCenter: ${c.name} (ID: ${c.id})`);
      console.log(`- Pending Loans: ${pendingLoans.length}`);
      console.log(`- Approved Pending Loans: ${approvedPendingLoans.length}`);
      console.log(`- Old isPDComplete: ${oldPDComplete}`);
      console.log(`- New isPDComplete: ${newPDComplete}`);
      console.log(`- Pending Loans details:`, pendingLoans.map(l => ({ id: l.id, member_id: l.member_id, status: l.status, name: l.person_name })));
    }
  } catch (err) {
    console.error(err);
  }
}

run();
