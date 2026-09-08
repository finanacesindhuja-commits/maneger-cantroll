const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSengai() {
  const { data, error } = await supabase
    .from('centers')
    .select('*')
    .ilike('name', '%SENGAI-06%');
    
  if (error) console.error("Error:", error);
  else console.log("SENGAI-06 Centers:", data);
}

checkSengai();
