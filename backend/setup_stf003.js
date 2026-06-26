const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupSTF003() {
  console.log('🚀 Setting up STF003 — Full Flow: Data Entry → Approval → Collection\n');

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Create Staff (Relationship Officer)
  // ═══════════════════════════════════════════════════════════════
  console.log('━━━ STEP 1: Creating Staff STF003 ━━━');

  // Check if staff already exists
  const { data: existingStaff } = await supabase
    .from('staff')
    .select('*')
    .ilike('staff_id', 'STF003')
    .single();

  if (existingStaff) {
    console.log('⚠️  STF003 already exists. Updating role to Relationship Officer...');
    const { error } = await supabase
      .from('staff')
      .update({
        name: 'Ravi Kumar',
        role: 'Relationship Officer',
        branch: 'Main Branch',
        password: 'staff123',
        is_password_set: true
      })
      .eq('id', existingStaff.id);

    if (error) {
      console.error('❌ Staff update error:', error.message);
      return;
    }
    console.log('✅ STF003 updated as Relationship Officer');
  } else {
    console.log('Creating new staff STF003...');
    const { error } = await supabase
      .from('staff')
      .insert([{
        staff_id: 'STF003',
        name: 'Ravi Kumar',
        mobile: '9876543210',
        role: 'Relationship Officer',
        branch: 'Main Branch',
        password: 'staff123',
        is_password_set: true
      }]);

    if (error) {
      console.error('❌ Staff creation error:', error.message);
      return;
    }
    console.log('✅ STF003 created — Ravi Kumar (Relationship Officer, Main Branch)');
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Create Centers for STF003
  // ═══════════════════════════════════════════════════════════════
  console.log('\n━━━ STEP 2: Creating Centers ━━━');

  const centersToCreate = [
    { name: 'Thiruvalluvar Center', staff_id: 'STF003' },
    { name: 'Bharathiyar Center', staff_id: 'STF003' },
  ];

  // Check existing centers for STF003
  const { data: existingCenters } = await supabase
    .from('centers')
    .select('id, name')
    .eq('staff_id', 'STF003');

  let centerIds = [];

  if (existingCenters && existingCenters.length >= 2) {
    console.log(`⚠️  STF003 already has ${existingCenters.length} centers. Using existing.`);
    centerIds = existingCenters.map(c => c.id);
  } else {
    // Delete any partial existing centers for clean setup
    if (existingCenters && existingCenters.length > 0) {
      await supabase.from('centers').delete().eq('staff_id', 'STF003');
    }

    const { data: newCenters, error } = await supabase
      .from('centers')
      .insert(centersToCreate)
      .select();

    if (error) {
      console.error('❌ Center creation error:', error.message);
      return;
    }
    centerIds = newCenters.map(c => c.id);
    console.log(`✅ Created ${newCenters.length} centers:`);
    newCenters.forEach(c => console.log(`   📍 ${c.name} (ID: ${c.id})`));
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Create Members in each center
  // ═══════════════════════════════════════════════════════════════
  console.log('\n━━━ STEP 3: Creating Members ━━━');

  const membersData = [
    // Center 1 - Thiruvalluvar Center
    { center_id: centerIds[0], name: 'Lakshmi Devi', member_no: 'M001' },
    { center_id: centerIds[0], name: 'Saroja Bai', member_no: 'M002' },
    { center_id: centerIds[0], name: 'Meena Kumari', member_no: 'M003' },
    { center_id: centerIds[0], name: 'Geetha Rani', member_no: 'M004' },
    // Center 2 - Bharathiyar Center
    { center_id: centerIds[1], name: 'Anitha Sundari', member_no: 'M005' },
    { center_id: centerIds[1], name: 'Kavitha Devi', member_no: 'M006' },
    { center_id: centerIds[1], name: 'Priya Dharshini', member_no: 'M007' },
  ];

  // Check existing members
  const { data: existingMembers } = await supabase
    .from('members')
    .select('id, name, center_id')
    .in('center_id', centerIds);

  let membersList = [];

  if (existingMembers && existingMembers.length > 0) {
    console.log(`⚠️  ${existingMembers.length} members already exist. Using existing.`);
    membersList = existingMembers;
  } else {
    const { data: newMembers, error } = await supabase
      .from('members')
      .insert(membersData)
      .select();

    if (error) {
      console.error('❌ Member creation error:', error.message);
      return;
    }
    membersList = newMembers;
    console.log(`✅ Created ${newMembers.length} members:`);
    newMembers.forEach(m => console.log(`   👤 ${m.name} (${m.member_no})`));
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 4: Create Loans (CREDITED status — ready for scheduling)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n━━━ STEP 4: Creating Loans (CREDITED) ━━━');

  // Check existing loans
  const memberIds = membersList.map(m => m.id);
  const { data: existingLoans } = await supabase
    .from('loans')
    .select('id, member_id, status')
    .in('member_id', memberIds);

  let loansList = [];

  if (existingLoans && existingLoans.length > 0) {
    console.log(`⚠️  ${existingLoans.length} loans already exist. Using existing.`);
    loansList = existingLoans;
  } else {
    const loansToCreate = membersList.map(m => ({
      member_id: m.id,
      member_name: m.name,
      center_id: m.center_id,
      amount_sanctioned: 10000,
      status: 'CREDITED',
      scheme_name: '₹10,000 (12-Week Plan)',
      staff_id: 'STF003',
      sanctioned_at: new Date().toISOString()
    }));

    const { data: newLoans, error } = await supabase
      .from('loans')
      .insert(loansToCreate)
      .select();

    if (error) {
      console.error('❌ Loan creation error:', error.message);
      return;
    }
    loansList = newLoans;
    console.log(`✅ Created ${newLoans.length} loans (₹10,000 each, CREDITED status):`);
    newLoans.forEach(l => console.log(`   💰 ${l.member_name} — ₹${l.amount_sanctioned} [${l.status}]`));
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 5: Create Collection Schedules for TODAY
  //         (Some Paid, some Pending — to test the breakdown)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n━━━ STEP 5: Creating Collection Schedules for Today ━━━');

  const today = new Date().toISOString().split('T')[0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = dayNames[new Date().getDay()];

  // Delete any existing schedules for these centers on today
  await supabase
    .from('collection_schedules')
    .delete()
    .in('center_id', centerIds)
    .eq('scheduled_date', today);

  // Get center names
  const { data: centerDetails } = await supabase
    .from('centers')
    .select('id, name')
    .in('id', centerIds);

  const centerNameMap = {};
  if (centerDetails) centerDetails.forEach(c => { centerNameMap[c.id] = c.name; });

  const schedulesToCreate = [];

  membersList.forEach((member, idx) => {
    const centerName = centerNameMap[member.center_id] || 'Unknown Center';

    // Alternate: some Paid, some Pending — to show the filter working
    let status;
    if (idx < 3) {
      status = 'Paid';  // First 3 members: Paid (will show in Center Breakdown)
    } else if (idx < 5) {
      status = 'Pending'; // Next 2: Pending (will NOT show in breakdown)
    } else {
      status = 'Paid'; // Last 2: Paid
    }

    schedulesToCreate.push({
      center_id: member.center_id,
      center_name: centerName,
      member_id: member.id,
      member_name: member.name,
      week_number: 1,
      scheduled_date: today,
      scheduled_day: todayDayName,
      amount: 1100,
      collected_amount: status === 'Paid' ? 1100 : 0,
      status: status
    });
  });

  const { data: schedules, error: schError } = await supabase
    .from('collection_schedules')
    .insert(schedulesToCreate)
    .select();

  if (schError) {
    console.error('❌ Schedule creation error:', schError.message);
    return;
  }

  console.log(`✅ Created ${schedules.length} collection schedules for today (${today}):`);
  schedules.forEach(s => {
    const icon = s.status === 'Paid' ? '💚' : '⏳';
    console.log(`   ${icon} ${s.member_name} — ₹${s.amount} [${s.status}] → ${s.center_name}`);
  });

  // ═══════════════════════════════════════════════════════════════
  // STEP 6: Update loans to DISBURSED (as if schedule was created)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n━━━ STEP 6: Updating Loans to DISBURSED ━━━');
  
  const loanIds = loansList.map(l => l.id);
  const { error: updateError } = await supabase
    .from('loans')
    .update({ status: 'DISBURSED' })
    .in('id', loanIds);

  if (updateError) {
    console.error('❌ Loan update error:', updateError.message);
  } else {
    console.log(`✅ ${loanIds.length} loans updated to DISBURSED`);
  }

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║          ✅ STF003 SETUP COMPLETE!               ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║ Staff:    STF003 — Ravi Kumar (RO, Main Branch) ║');
  console.log(`║ Centers:  ${centerIds.length} centers created                    ║`);
  console.log(`║ Members:  ${membersList.length} members created                    ║`);
  console.log(`║ Loans:    ${loansList.length} loans (₹10,000 each, DISBURSED)   ║`);
  console.log(`║ Schedules: ${schedules.length} for today (${today})        ║`);
  console.log('║                                                  ║');
  console.log('║ Collection Breakdown:                            ║');
  const paidCount = schedules.filter(s => s.status === 'Paid').length;
  const pendingCount = schedules.filter(s => s.status === 'Pending').length;
  console.log(`║   💚 Paid:    ${paidCount} bills (shows in Center Breakdown)  ║`);
  console.log(`║   ⏳ Pending: ${pendingCount} bills (hidden in Breakdown)      ║`);
  console.log('╚══════════════════════════════════════════════════╝');

  process.exit(0);
}

setupSTF003().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
