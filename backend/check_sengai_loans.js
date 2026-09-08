const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ojhxryeefkzhgwxwgsxj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaHhyeWVlZmt6aGd3eHdnc3hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg1NTEzNCwiZXhwIjoyMDg5NDMxMTM0fQ.ebd11rAKtb1n67IduQO8m5dWGzvf9S1ib1Fr_KQx5kY');

async function checkSengaiLoans() {
  const { data: loans, error } = await supabase
    .from('loans')
    .select('*')
    .eq('center_name', 'SENGAI-06');
    
  console.log("Loans in SENGAI-06:");
  if (loans) {
      loans.forEach(l => {
          console.log(`- ${l.member_name}: status=${l.status}, amount_sanctioned=${l.amount_sanctioned}, id=${l.id}`);
      });
      console.log("\nSample full loan object:", loans[0]);
  } else {
      console.log("Error fetching loans:", error);
  }
}

checkSengaiLoans();
