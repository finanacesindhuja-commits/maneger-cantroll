const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ojhxryeefkzhgwxwgsxj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaHhyeWVlZmt6aGd3eHdnc3hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg1NTEzNCwiZXhwIjoyMDg5NDMxMTM0fQ.ebd11rAKtb1n67IduQO8m5dWGzvf9S1ib1Fr_KQx5kY');

async function fixStatus() {
  const { data, error } = await supabase
    .from('loans')
    .update({ status: 'CREDITED' })
    .eq('center_name', 'SENGAI-06')
    .eq('status', 'SANCTIONED')
    .eq('disbursement_status', 'CREDITED')
    .select();
    
  console.log("Updated loans:", data ? data.length : 0);
  if (error) console.error(error);
}

fixStatus();
