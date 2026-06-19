require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('Fetching collection_schedules for valarmathi...');
  const { data: schedules, error: schError } = await supabase
    .from('collection_schedules')
    .select('*')
    .ilike('member_name', '%valarmathi%');
  
  if (schError) {
    console.error(schError);
  } else {
    // just print the first one to see columns
    if(schedules.length > 0) {
      console.log('Columns in schedule:', Object.keys(schedules[0]));
      console.log('Penalty value if any:', schedules[0].penalty);
    }
  }
}

check();
