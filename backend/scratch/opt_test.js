const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  console.time('Fetch PDs');
  const { data: pdData, error } = await supabase
    .from('pd_verifications')
    .select('member_id, center_id')
    .or('status.ilike.APPROVED,pd_verified.eq.true');
  console.timeEnd('Fetch PDs');
  console.log('Error:', error);
  console.log('Result count:', pdData?.length);
  if (pdData?.length > 0) console.log(pdData[0]);
}
test();
