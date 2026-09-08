const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ojhxryeefkzhgwxwgsxj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaHhyeWVlZmt6aGd3eHdnc3hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg1NTEzNCwiZXhwIjoyMDg5NDMxMTM0fQ.ebd11rAKtb1n67IduQO8m5dWGzvf9S1ib1Fr_KQx5kY');

async function checkSengai() {
  const centerName = 'SENGAI-06';
  
  // Check loans
  const { data: loans } = await supabase
    .from('loans')
    .select('*')
    .eq('center_name', centerName);
  
  console.log(`Loans for ${centerName}:`, loans ? loans.length : 0);
  
  // Check schedules
  const { data: schedules } = await supabase
    .from('collection_schedules')
    .select('*')
    .eq('center_name', centerName);
  
  console.log(`Schedules for ${centerName}:`, schedules ? schedules.length : 0);
  
  if (loans && loans.length > 0) {
     console.log("Sample loan status:", loans[0].status, "Loan Amount:", loans[0].loan_amount);
  }
}

checkSengai();
