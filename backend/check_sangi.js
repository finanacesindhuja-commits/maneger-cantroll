const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ojhxryeefkzhgwxwgsxj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaHhyeWVlZmt6aGd3eHdnc3hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg1NTEzNCwiZXhwIjoyMDg5NDMxMTM0fQ.ebd11rAKtb1n67IduQO8m5dWGzvf9S1ib1Fr_KQx5kY');

async function getCenters() {
  const { data: centers } = await supabase
    .from('centers')
    .select('center_name');
  
  const { data: loans } = await supabase
    .from('loans')
    .select('center_name')
    .limit(100);

  console.log("All centers:", centers);
  
  // Also let's check unique center names from loans if centers table is empty
  const uniqueCenters = [...new Set(loans.map(l => l.center_name))];
  console.log("Unique centers in loans:", uniqueCenters);
}

getCenters();
