const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function find() {
  console.log("Searching in loans...");
  const { data: loans } = await supabase.from('loans').select('*').ilike('center_name', '%kodavasal%');
  console.log("Loans:", loans?.length, "records");
  if(loans?.length > 0) {
      console.log(loans.find(l => l.group_name?.toLowerCase().includes('a9') || l.member_name?.toLowerCase().includes('a9')));
  }

  const { data: loans2 } = await supabase.from('loans').select('*').ilike('group_name', '%a9%');
  console.log("Loans with a9:", loans2?.length, "records");
  if(loans2?.length > 0) {
      console.log(loans2.find(l => l.center_name?.toLowerCase().includes('kodavasal')));
      if(loans2.length < 5) console.log(loans2);
  }

  console.log("Searching in collection_schedules...");
  const { data: schedules } = await supabase.from('collection_schedules').select('*').ilike('center_name', '%kodavasal%');
  console.log("Schedules:", schedules?.length, "records");
  if (schedules?.length > 0) {
      console.log(schedules.find(s => s.group_name?.toLowerCase().includes('a9')));
  }
}

find().catch(console.error);
