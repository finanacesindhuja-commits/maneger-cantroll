const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getDetails() {
  const centerName = 'RARANTHIMANGALAM-04';
  
  // 1. Get Center
  const { data: centers, error: centerErr } = await supabase
    .from('centers')
    .select('*')
    .ilike('name', `%${centerName}%`);
    
  if (centerErr || !centers || centers.length === 0) {
    console.log("Center not found");
    return;
  }
  
  const centerId = centers[0].id;
  console.log(`Center Found: ${centers[0].name} (ID: ${centerId})`);
  
  // 2. Get Loans
  const { data: loans, error: loansErr } = await supabase
    .from('loans')
    .select('id, amount_sanctioned, member_id, status, member_name')
    .eq('center_id', centerId);
    
  let totalAmount = 0;
  if (loans) {
    loans.forEach(l => {
      totalAmount += Number(l.amount_sanctioned || 0);
      console.log(`Loan - Member: ${l.member_name || l.member_id}, Amount: ₹${l.amount_sanctioned}, Status: ${l.status}`);
    });
    console.log(`\nTotal Amount Sanctioned: ₹${totalAmount}\n`);
  }
  
  // 3. Get Schedules
  // We just get for one loan to show the schedule structure, or all if needed
  if (loans && loans.length > 0) {
    const loanIds = loans.map(l => l.id);
    const { data: schedules, error: schedErr } = await supabase
      .from('loan_schedules')
      .select('*')
      .in('loan_id', loanIds)
      .order('due_date', { ascending: true });
      
    if (schedules && schedules.length > 0) {
      // Group by due_date to show center level schedule
      const centerSchedule = {};
      schedules.forEach(s => {
        if (!centerSchedule[s.due_date]) {
          centerSchedule[s.due_date] = 0;
        }
        centerSchedule[s.due_date] += Number(s.installment_amount);
      });
      
      console.log("Center Repayment Schedule:");
      let index = 1;
      for (const [date, amount] of Object.entries(centerSchedule)) {
        console.log(`Week ${index}: ${date} - Total Amount: ₹${amount}`);
        index++;
      }
    } else {
      console.log("No schedules found for these loans.");
    }
  }
}

getDetails();
