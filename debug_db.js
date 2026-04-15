const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'd:/full system sindhuja fin/maneger cantrol/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLoans() {
  console.log('🔍 Checking Loans Table...');
  const { data, error } = await supabase
    .from('loans')
    .select('id, member_name, center_name, status, member_id, center_id')
    .limit(10);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.table(data);

  console.log('\n🔍 Checking PD Verifications Table (Approved ones)...');
  const { data: pdData, error: pdError } = await supabase
    .from('pd_verifications')
    .select('member_id, center_id, status')
    .eq('status', 'Approved');

  if (pdError) {
    console.error('❌ PD Error:', pdError.message);
    return;
  }
  console.table(pdData);
}

checkLoans();
