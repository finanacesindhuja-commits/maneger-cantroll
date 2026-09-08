const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateStatus() {
  console.log("Temporarily setting SENGAI-06 (id: 40) loans to SANCTIONED...");
  
  const { data, error } = await supabase
    .from('loans')
    .update({ status: 'SANCTIONED' })
    .eq('center_id', 40)
    .eq('status', 'CREDITED')
    .select();
    
  if (error) console.error("Error:", error.message);
  else console.log(`Updated ${data?.length || 0} loans to SANCTIONED.`);
}

updateStatus();
