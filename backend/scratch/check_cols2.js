require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('collection_schedules').select('*').limit(1);
  if(data && data.length > 0) {
    console.log('collection_schedules columns:', Object.keys(data[0]));
  }
}

check();
