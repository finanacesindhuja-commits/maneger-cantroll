require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_tables'); // Or try querying information_schema
  // Wait, Supabase client doesn't easily do information_schema directly unless using RPC.
  // I will just use pg promise if it's there or just standard REST.
}
