const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// member_id -> loan amount mapping (from our check)
const memberAmountMap = {
  81: 13000, 82: 13000, 83: 13000, 84: 13000, 85: 13000,
  86: 10000, 87: 10000,
  88: 13000, 89: 10000, 90: 10000, 91: 10000,
  100: 11000, 101: 12000, 102: 12000, 103: 12000, 104: 12000, 105: 12000,
  106: 10000, 107: 10000, 108: 10000, 109: 10000,
  110: 10000, 111: 10000, 112: 10000, 113: 10000,
  114: 15000, 115: 15000, 116: 15000, 117: 15000
};

const loanPlans = {
  "10000": {
    name: "10000 (12-Week)",
    weeks: 12,
    amounts: [1100, 1100, 1100, 1100, 1080, 1080, 1080, 1080, 1070, 1070, 1070, 1070]
  },
  "11000": {
    name: "11000 (15-Week)",
    weeks: 15,
    amounts: [1050, 1050, 1050, 1050, 1020, 1020, 1020, 1020, 960, 960, 960, 960, 940, 940, 940]
  },
  "12000": {
    name: "12000 (16-Week)",
    weeks: 16,
    amounts: [1050, 1050, 1050, 1050, 1020, 1020, 1020, 1020, 980, 980, 980, 980, 950, 950, 950, 950]
  },
  "13000": {
    name: "13000 (18-Week)",
    weeks: 18,
    amounts: [1050, 1050, 1050, 1050, 1020, 1020, 1020, 1020, 990, 990, 990, 990, 970, 970, 970, 970, 940, 940]
  },
  "15000": {
    name: "15000 (22-Week)",
    weeks: 22,
    amounts: [1000, 1000, 1000, 1000, 980, 980, 980, 980, 960, 960, 960, 960, 940, 940, 940, 940, 920, 920, 920, 920, 900, 900]
  }
};

async function fixNullLoanIdSchedules() {
  // Get all schedules with null loan_id
  const { data: schedules, error } = await supabase
    .from('collection_schedules')
    .select('id, member_id, week_number, amount, status')
    .is('loan_id', null)
    .not('member_id', 'is', null);

  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  console.log(`Found ${schedules.length} schedules with null loan_id`);

  let updated = 0, skipped = 0, noMap = 0;

  for (const sch of schedules) {
    const memberAmount = memberAmountMap[sch.member_id];
    if (!memberAmount) {
      console.log(`  No amount mapping for member ${sch.member_id}`);
      noMap++;
      continue;
    }

    const plan = loanPlans[String(memberAmount)];
    if (!plan) {
      console.log(`  No plan for amount ${memberAmount} (member ${sch.member_id})`);
      noMap++;
      continue;
    }

    if (sch.week_number > plan.weeks) {
      console.log(`  SKIP member ${sch.member_id} week ${sch.week_number} - exceeds plan weeks ${plan.weeks}`);
      skipped++;
      continue;
    }

    const expectedAmount = plan.amounts[sch.week_number - 1];
    if (sch.amount === expectedAmount) {
      skipped++;
      continue;
    }

    console.log(`FIXING member ${sch.member_id} (${memberAmount}), week ${sch.week_number}: ${sch.amount} -> ${expectedAmount}`);
    const { error: upErr } = await supabase
      .from('collection_schedules')
      .update({ amount: expectedAmount })
      .eq('id', sch.id);

    if (upErr) {
      console.error(`  ERROR:`, upErr.message);
    } else {
      updated++;
    }
  }

  console.log(`\nDone! Updated: ${updated} | Skipped (correct): ${skipped} | No mapping: ${noMap}`);
}

fixNullLoanIdSchedules();
