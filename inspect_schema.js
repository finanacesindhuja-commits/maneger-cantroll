const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'd:/full system sindhuja fin/maneger cantrol/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectTable() {
  console.log('🔍 Inspecting collection_schedules table...');
  // We can't easily get schema, so we just select one row to see keys
  const { data, error } = await supabase
    .from('collection_schedules')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Columns found:', Object.keys(data[0]));
  } else {
    console.log('⚠️ No data in table, attempting to fetch a loan instead...');
    const { data: loanData, error: lError } = await supabase.from('loans').select('*').limit(1);
    if (!lError && loanData.length > 0) console.log('Loans columns:', Object.keys(loanData[0]));
  }
}

inspectTable();
