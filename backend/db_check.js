// Database Status Check Script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDatabaseStatus() {
  console.log('\n========================================');
  console.log('   DATABASE STATUS CHECK');
  console.log('========================================\n');

  // 1. Check pd_verifications table - all distinct statuses
  console.log('📋 [1] PD_VERIFICATIONS TABLE - Status Values:');
  const { data: pdAll, error: pdErr } = await supabase
    .from('pd_verifications')
    .select('member_id, center_id, status, pd_verified')
    .limit(100);

  if (pdErr) {
    console.log('   ERROR:', pdErr.message);
  } else {
    const statusCounts = {};
    pdAll.forEach(p => {
      const key = `status="${p.status}" | pd_verified=${p.pd_verified}`;
      statusCounts[key] = (statusCounts[key] || 0) + 1;
    });
    console.log('   Total PD records:', pdAll.length);
    Object.entries(statusCounts).forEach(([k, v]) => console.log(`   ${v}x → ${k}`));
    console.log('   Sample records:', JSON.stringify(pdAll.slice(0, 3), null, 2));
  }

  // 2. Check loans table - all distinct statuses
  console.log('\n📋 [2] LOANS TABLE - Status Values:');
  const { data: loansAll, error: loansErr } = await supabase
    .from('loans')
    .select('id, center_id, member_id, status, amount_sanctioned')
    .limit(200);

  if (loansErr) {
    console.log('   ERROR:', loansErr.message);
  } else {
    const loanStatusCounts = {};
    loansAll.forEach(l => {
      loanStatusCounts[l.status] = (loanStatusCounts[l.status] || 0) + 1;
    });
    console.log('   Total Loan records:', loansAll.length);
    Object.entries(loanStatusCounts).forEach(([k, v]) => console.log(`   ${v}x → status="${k}"`));
    console.log('   Sample records:', JSON.stringify(loansAll.slice(0, 3), null, 2));
  }

  // 3. Check centers table
  console.log('\n📋 [3] CENTERS TABLE:');
  const { data: centersAll, error: centersErr } = await supabase
    .from('centers')
    .select('*');

  if (centersErr) {
    console.log('   ERROR:', centersErr.message);
  } else {
    console.log('   Total Centers:', centersAll.length);
    centersAll.forEach(c => console.log(`   Center: id=${c.id} | name="${c.name}" | staff_id=${c.staff_id}`));
  }

  // 4. Cross-check: For each center with PD-verified members, show loan status
  console.log('\n📋 [4] PD VERIFIED CENTERS ANALYSIS:');
  
  // Get all verified members (any status that indicates verification)
  const { data: verifiedPD } = await supabase
    .from('pd_verifications')
    .select('member_id, center_id, status, pd_verified');

  if (verifiedPD && verifiedPD.length > 0) {
    // Group by center
    const byCenterMap = {};
    verifiedPD.forEach(pd => {
      const cid = String(pd.center_id);
      if (!byCenterMap[cid]) byCenterMap[cid] = { verified: [], notVerified: [] };
      
      // Check if considered verified
      const isVerified = pd.pd_verified === true || 
                         (pd.status && pd.status.toLowerCase().includes('approved')) ||
                         (pd.status && pd.status.toLowerCase().includes('verified')) ||
                         (pd.status && pd.status.toLowerCase() === 'verified');
      
      if (isVerified) byCenterMap[cid].verified.push(pd.member_id);
      else byCenterMap[cid].notVerified.push({ member_id: pd.member_id, status: pd.status });
    });

    for (const [cid, grp] of Object.entries(byCenterMap)) {
      const center = (centersAll || []).find(c => String(c.id) === cid);
      console.log(`\n   Center ID: ${cid} | Name: ${center?.name || 'Unknown'}`);
      console.log(`     ✅ Verified members (${grp.verified.length}): ${grp.verified.join(', ')}`);
      console.log(`     ❌ Not verified (${grp.notVerified.length}): ${JSON.stringify(grp.notVerified)}`);
      
      // Check loan status for verified members
      if (grp.verified.length > 0 && loansAll) {
        const centerLoans = loansAll.filter(l => String(l.center_id) === cid);
        console.log(`     Loans in center (${centerLoans.length}):`);
        centerLoans.forEach(l => console.log(`       member_id=${l.member_id} | status="${l.status}" | amount=${l.amount_sanctioned}`));
      }
    }
  } else {
    console.log('   No PD verification records found!');
  }

  // 5. Show EXACT what canSanction logic evaluates
  console.log('\n📋 [5] canSanction LOGIC SIMULATION:');
  const approvedStatuses = (verifiedPD || [])
    .filter(pd => pd.pd_verified === true || (pd.status && (pd.status.toLowerCase().includes('approved') || pd.status.toLowerCase().includes('verified'))))
    .map(pd => String(pd.member_id));
  const approvedSet = new Set(approvedStatuses);
  console.log(`   Total PD-approved members globally: ${approvedSet.size}`);
  console.log(`   Member IDs: ${[...approvedSet].join(', ')}`);

  if (loansAll && centersAll) {
    centersAll.forEach(c => {
      const cLoans = loansAll.filter(l => String(l.center_id) === String(c.id));
      if (cLoans.length === 0) return;
      
      const loanMemberIds = [...new Set(cLoans.map(l => String(l.member_id)))];
      const approvedLoanMembers = loanMemberIds.filter(mid => approvedSet.has(mid));
      const isPDComplete = loanMemberIds.length > 0 && approvedLoanMembers.length === loanMemberIds.length;
      const isApproved = cLoans.some(l => l.status === 'APPROVED');
      const isReadyForPD = cLoans.some(l => l.status === 'READY FOR PD');
      const canSanction = isPDComplete && (isApproved || isReadyForPD);
      
      console.log(`\n   Center: "${c.name}" (id=${c.id})`);
      console.log(`     Loan statuses: ${cLoans.map(l => l.status).join(', ')}`);
      console.log(`     Loan member IDs: ${loanMemberIds.join(', ')}`);
      console.log(`     PD-approved: ${approvedLoanMembers.join(', ')} (${approvedLoanMembers.length}/${loanMemberIds.length})`);
      console.log(`     isPDComplete: ${isPDComplete} | isApproved: ${isApproved} | isReadyForPD: ${isReadyForPD}`);
      console.log(`     ★ canSanction: ${canSanction}`);
    });
  }

  console.log('\n========================================');
  console.log('   CHECK COMPLETE');
  console.log('========================================\n');
}

checkDatabaseStatus().catch(console.error);
