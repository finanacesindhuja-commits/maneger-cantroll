const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  const { data: centers } = await supabase.from('centers').select('*').limit(1);
  console.log('Centers columns:', Object.keys(centers[0] || {}));
  
  const { data: staff } = await supabase.from('staff').select('*').limit(1);
  console.log('Staff columns:', Object.keys(staff[0] || {}));
  
  const { data: schedules } = await supabase.from('collection_schedules').select('*').limit(1);
  console.log('Schedules columns:', Object.keys(schedules[0] || {}));
}

checkSchema();
