const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: pd } = await supabase.from('pd_verifications').select('*').limit(10);
  console.log('PD Verifications:', pd);
  
  const { data: loans } = await supabase.from('loans').select('*').limit(10);
  console.log('Loans:', loans);
}
test();
