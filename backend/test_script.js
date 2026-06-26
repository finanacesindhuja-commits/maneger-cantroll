const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ojhxryeefkzhgwxwgsxj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaHhyeWVlZmt6aGd3eHdnc3hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg1NTEzNCwiZXhwIjoyMDg5NDMxMTM0fQ.ebd11rAKtb1n67IduQO8m5dWGzvf9S1ib1Fr_KQx5kY');

async function run() {
  const { data } = await supabase.from('collection_schedules').select('id, member_name, status, collected_amount');
  const problematic = data.filter(r => !['Paid', 'Received', 'Partial'].includes(r.status) && r.collected_amount > 0);
  console.log('Problematic:', problematic.length);
  
  const wrongReceived = data.filter(r => r.status === 'Received' && (r.collected_amount === null || r.collected_amount === 0));
  console.log('Wrong Received:', wrongReceived.length);
}

run();
