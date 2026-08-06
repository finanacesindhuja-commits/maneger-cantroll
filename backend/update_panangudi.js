const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// New 22-week plan amounts for 15000
// Total = 21000
// Week 1-4: 1000, Week 5-8: 980, Week 9-12: 960, Week 13-16: 940, Week 17-20: 920, Week 21-22: 900
const newAmounts = {
  1: 1000, 2: 1000, 3: 1000, 4: 1000,
  5: 980,  6: 980,  7: 980,  8: 980,
  9: 960, 10: 960, 11: 960, 12: 960,
  13: 940, 14: 940, 15: 940, 16: 940,
  17: 920, 18: 920, 19: 920, 20: 920,
  21: 900, 22: 900
};

async function run() {
  // Fetch all APPROVED schedules for PANANGUDI-06 (center_id=17)
  const { data, error } = await supabase
    .from('collection_schedules')
    .select('id, week_number, amount, status, scheduled_date, member_name')
    .eq('center_id', 17)
    .eq('status', 'Approved')
    .order('week_number');

  if (error) { console.log('Fetch error:', error); return; }

  console.log(`Found ${data.length} Approved schedules to update`);

  let updated = 0, skipped = 0;

  for (const row of data) {
    const newAmt = newAmounts[row.week_number];
    if (!newAmt) {
      console.log(`  SKIP week ${row.week_number} - no mapping`);
      skipped++;
      continue;
    }
    if (row.amount === newAmt) {
      console.log(`  SKIP week ${row.week_number} ${row.member_name} - already ${newAmt}`);
      skipped++;
      continue;
    }

    const { error: upErr } = await supabase
      .from('collection_schedules')
      .update({ amount: newAmt })
      .eq('id', row.id);

    if (upErr) {
      console.log(`  ERROR week ${row.week_number} ${row.member_name}:`, upErr.message);
    } else {
      console.log(`  UPDATED week ${row.week_number} ${row.member_name}: ${row.amount} -> ${newAmt}`);
      updated++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
}

run();
