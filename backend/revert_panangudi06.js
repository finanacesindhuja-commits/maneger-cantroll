const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Old 20-week plan amounts for PANANGUDI-06 (revert back)
const oldAmounts = {
  10: 980, 11: 980, 12: 980,
  13: 950, 14: 950, 15: 950, 16: 950
};

async function run() {
  const { data, error } = await supabase
    .from('collection_schedules')
    .select('id, week_number, amount, status, member_name')
    .eq('center_id', 17)
    .eq('status', 'Approved')
    .order('week_number');

  if (error) { console.log('Fetch error:', error); return; }

  console.log(`Reverting ${data.length} records for PANANGUDI-06...`);
  let updated = 0;

  for (const row of data) {
    const oldAmt = oldAmounts[row.week_number];
    if (!oldAmt) { console.log(`  SKIP week ${row.week_number}`); continue; }

    const { error: upErr } = await supabase
      .from('collection_schedules')
      .update({ amount: oldAmt })
      .eq('id', row.id);

    if (upErr) {
      console.log(`  ERROR:`, upErr.message);
    } else {
      console.log(`  REVERTED week ${row.week_number} ${row.member_name}: ${row.amount} -> ${oldAmt}`);
      updated++;
    }
  }
  console.log(`\nReverted: ${updated} records`);
}

run();
