require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

supabase.from('collection_schedules').select('id, member_id, member_name').limit(20).then(res => {
  console.log('Schedules:', res.data);
  const ids = res.data.map(d => d.member_id);
  supabase.from('loans').select('id, member_id, member_name, amount_sanctioned')
    .or(`id.in.(${ids.join(',')}),member_id.in.(${ids.join(',')})`)
    .then(r2 => console.log('Loans:', r2.data));
});
