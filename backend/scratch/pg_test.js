require('dotenv').config();
const { Client } = require('pg');

async function check() {
  const client = new Client({ connectionString: process.env.SUPABASE_URL.replace('https', 'postgres').replace('.supabase.co', '.supabase.co:5432/postgres') }); // Wait, maybe SUPABASE_URL is just https API url.
  console.log(process.env.SUPABASE_URL);
}
check();
