const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
  const { data: centers } = await supabase.from('centers').select('*').ilike('name', '%a9%');
  console.log("Centers with A9:", centers);

  const { data: loans } = await supabase.from('loans').select('*').ilike('center_name', '%a9%');
  console.log("Loans with center_name A9:", loans?.length);

  const { data: schedules } = await supabase.from('collection_schedules').select('*').ilike('center_name', '%a9%');
  console.log("Schedules with center_name A9:", schedules?.length);
}

checkData().catch(console.error);
