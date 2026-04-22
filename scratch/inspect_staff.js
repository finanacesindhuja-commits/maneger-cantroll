const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
// Using the correct relative path for .env
dotenv.config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectStaffTable() {
  console.log('🔍 Inspecting staff table...');
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Columns found:', Object.keys(data[0]));
    console.log('📊 Sample data:', data[0]);
  } else {
    console.log('⚠️ No data in staff table.');
  }
}

inspectStaffTable();
