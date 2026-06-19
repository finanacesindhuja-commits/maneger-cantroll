require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const newPlan = [
  1050, 1050, 1050, 1050,
  1020, 1020, 1020, 1020,
  990, 990, 990, 990,
  970, 970, 970, 970,
  940, 940
];

async function updateDatabase() {
  console.log('Starting DB update for 13000 loans...');
  
  // Get all loans of 13000
  const { data: loans, error: loanErr } = await supabase
    .from('loans')
    .select('id, member_name')
    .eq('amount_sanctioned', 13000);
    
  if (loanErr) {
    console.error('Error fetching loans:', loanErr);
    return;
  }
  
  console.log(`Found ${loans.length} loans with 13000 amount.`);
  
  let updatedCount = 0;
  
  for (const loan of loans) {
    // Get schedules for this loan
    const { data: schedules, error: schErr } = await supabase
      .from('collection_schedules')
      .select('id, week_number, amount')
      .eq('member_id', loan.id)
      .order('week_number', { ascending: true });
      
    if (schErr) {
      console.error(`Error fetching schedules for loan ${loan.id}:`, schErr);
      continue;
    }
    
    if (!schedules || schedules.length === 0) continue;
    
    // Check if the first week's amount is the old amount (990)
    // If so, update all 18 weeks
    const firstWeek = schedules.find(s => s.week_number === 1);
    if (firstWeek && firstWeek.amount !== 1050) {
      console.log(`Updating schedules for member: ${loan.member_name} (ID: ${loan.id})`);
      
      for (const sch of schedules) {
        const weekIndex = sch.week_number - 1;
        if (weekIndex >= 0 && weekIndex < newPlan.length) {
          const expectedAmount = newPlan[weekIndex];
          if (sch.amount !== expectedAmount) {
            await supabase
              .from('collection_schedules')
              .update({ amount: expectedAmount })
              .eq('id', sch.id);
          }
        }
      }
      updatedCount++;
    }
  }
  
  console.log(`Finished DB update. Updated schedules for ${updatedCount} loans.`);
}

updateDatabase();
