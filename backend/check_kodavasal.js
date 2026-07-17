const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
  console.log("Checking for anything related to Kodavasal...");
  
  const { data: centers } = await supabase.from('centers').select('*').ilike('name', '%kodavasal%');
  console.log("Centers:", centers);
  
  if (centers && centers.length > 0) {
      const centerId = centers[0].id;
      
      const { data: loans } = await supabase.from('loans').select('*').eq('center_id', centerId).limit(5);
      console.log("Sample loans in Kodavasal:", loans);

      const { data: schedules } = await supabase.from('collection_schedules').select('*').ilike('center_name', '%kodavasal%').limit(5);
      console.log("Sample schedules in Kodavasal:", schedules);
  } else {
      console.log("No center found with 'kodavasal'.");
  }
}

checkData().catch(console.error);
