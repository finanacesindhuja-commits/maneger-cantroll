require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const tables = ['staff', 'loans', 'pd_verifications', 'members', 'centers', 'collection_schedules'];
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      if (error) {
        console.error(`Error counting ${table}:`, error.message);
      } else {
        console.log(`${table}: ${count} rows`);
      }
    } catch (err) {
      console.error(`Failed for ${table}:`, err);
    }
  }
}

run();
