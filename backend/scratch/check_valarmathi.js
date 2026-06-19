require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('Querying collection_schedules for valarmathi...');
  const { data: schedules, error: schError } = await supabase
    .from('collection_schedules')
    .select('*')
    .ilike('member_name', '%valarmathi%');
  
  if (schError) {
    console.error(schError);
  } else {
    console.log('Schedules:', schedules);
  }

  const { data: members, error: memError } = await supabase
    .from('members')
    .select('*')
    .ilike('name', '%valarmathi%');
    
  if (memError) {
    console.error(memError);
  } else {
    console.log('Members:', members);
  }
}

check();
