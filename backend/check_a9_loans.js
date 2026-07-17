const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
  const { data: loans } = await supabase.from('loans').select('id, member_name, center_name, amount_sanctioned').ilike('center_name', '%KUDAVASAL -A9%');
  console.log("Loans with center_name KUDAVASAL -A9:", loans);
}

checkData().catch(console.error);
