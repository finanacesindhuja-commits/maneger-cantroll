const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Week 20 last date is 2026-12-04 (Friday)
// Week 21 = 2026-12-11, Week 22 = 2026-12-18

const members = [
  { member_id: 118, member_name: 'Sathya S' },
  { member_id: 119, member_name: 'Jeeva M' },
  { member_id: 120, member_name: 'Swetha D' },
  { member_id: 121, member_name: 'Vasugi R' },
];

async function run() {
  const newRows = [];

  for (const week of [21, 22]) {
    // Week 21 = Dec 11, Week 22 = Dec 18 (Fridays)
    const date = week === 21 ? '2026-12-11' : '2026-12-18';

    for (const member of members) {
      newRows.push({
        center_id: 32,
        center_name: 'PANANGUDI -07',
        scheduled_date: date,
        scheduled_day: 'Friday',
        status: 'Approved',
        amount: 900,
        member_id: member.member_id,
        member_name: member.member_name,
        week_number: week,
        loan_id: null,
        collected_amount: null,
        approved_at: null,
        approved_by: null,
      });
    }
  }

  console.log(`Inserting ${newRows.length} new rows (week 21 & 22)...`);

  const { data, error } = await supabase
    .from('collection_schedules')
    .insert(newRows)
    .select();

  if (error) {
    console.log('ERROR:', error);
    return;
  }

  console.log(`Successfully inserted ${data.length} rows!`);

  // Verify totals
  const { data: all } = await supabase
    .from('collection_schedules')
    .select('amount, week_number')
    .eq('center_id', 32)
    .eq('member_id', 118); // check one member

  const total = all.reduce((sum, r) => sum + r.amount, 0);
  console.log(`\nTotal per member (Sathya S): ₹${total} (should be ₹21000)`);
  console.log(`Total weeks: ${all.length}`);
}

run();
