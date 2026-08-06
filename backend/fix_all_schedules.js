const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const loanPlans = {
  "10000": {
    name: "₹10,000 (12-Week Plan)",
    weeks: 12,
    amounts: [1100, 1100, 1100, 1100, 1080, 1080, 1080, 1080, 1070, 1070, 1070, 1070]
  },
  "11000": {
    name: "₹11,000 (15-Week Plan)",
    weeks: 15,
    amounts: [
      1050, 1050, 1050, 1050,
      1020, 1020, 1020, 1020,
      960, 960, 960, 960,
      940, 940, 940
    ]
  },
  "12000": {
    name: "₹12,000 (16-Week Plan)",
    weeks: 16,
    amounts: [
      1050, 1050, 1050, 1050,
      1020, 1020, 1020, 1020,
      980, 980, 980, 980,
      950, 950, 950, 950
    ]
  },
  "13000": {
    name: "₹13,000 (18-Week Plan)",
    weeks: 18,
    amounts: [
      1050, 1050, 1050, 1050,
      1020, 1020, 1020, 1020,
      990, 990, 990, 990,
      970, 970, 970, 970,
      940, 940
    ]
  },
  "15000": {
    name: "₹15,000 (22-Week Plan)",
    weeks: 22,
    amounts: [
      1000, 1000, 1000, 1000,
      980, 980, 980, 980,
      960, 960, 960, 960,
      940, 940, 940, 940,
      920, 920, 920, 920,
      900, 900
    ]
  }
};

async function fixSchedules() {
  // Get all loans
  const { data: loans, error: loanErr } = await supabase
    .from('loans')
    .select('id, amount_sanctioned, center_id')
    .not('amount_sanctioned', 'is', null);

  if (loanErr) {
    console.error('Error fetching loans:', loanErr);
    return;
  }

  console.log(`Found ${loans.length} loans to process...`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const loan of loans) {
    const memberAmount = Number(loan.amount_sanctioned);
    const plan = loanPlans[String(memberAmount)];
    
    // Only fix if we have a strict plan match, otherwise we assume scaling or 10k logic was intended
    if (!plan) continue;

    const { data: schedules, error: schErr } = await supabase
      .from('collection_schedules')
      .select('id, week_number, amount, status')
      .eq('loan_id', loan.id);
      
    if (schErr || !schedules || schedules.length === 0) continue;

    for (const schedule of schedules) {
      if (schedule.week_number > plan.weeks) continue;
      
      const expectedAmount = plan.amounts[schedule.week_number - 1];
      
      if (schedule.amount !== expectedAmount) {
        console.log(`Fixing Loan ${loan.id} (Sanctioned: ${memberAmount}), Week ${schedule.week_number}: ${schedule.amount} -> ${expectedAmount}`);
        await supabase
          .from('collection_schedules')
          .update({ amount: expectedAmount })
          .eq('id', schedule.id);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }
  }

  console.log(`Done! Updated ${updatedCount} schedules. Skipped ${skippedCount} correct ones.`);
}

fixSchedules();
