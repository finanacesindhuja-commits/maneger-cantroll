require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: pd, error } = await supabase
    .from('pd_verifications')
    .select('*')
    .in('member_id', [74, 75, 76]);
  console.log("PD verifications for 74, 75, 76:", pd);

  const { data: loans } = await supabase
    .from('loans')
    .select('*')
    .in('member_id', [74, 75, 76]);
  console.log("Loans for 74, 75, 76:", loans);
}

run();
