const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLoans() {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('center_id', 40);
    
  if (error) console.error("Error:", error);
  else console.log("Loans for center 40:", data);
}

checkLoans();
