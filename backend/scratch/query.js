const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: pd } = await supabase.from('pd_verifications').select('status, center_id').eq('status', 'APPROVED');
  console.log('PD Approved count:', pd?.length);
  if (pd?.length > 0) console.log('Sample PD:', pd[0]);
  
  const { data: loans } = await supabase.from('loans').select('status, center_id, id').eq('status', 'APPROVED');
  console.log('Loans Approved count:', loans?.length);
  if (loans?.length > 0) console.log('Sample Loan:', loans[0]);
  
  // What are the center IDs available in loans?
  const { data: allCenters } = await supabase.from('centers').select('id, name');
  console.log('Total Centers:', allCenters?.length);
}
test();
