require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: pd } = await supabase.from('pd_verifications').select('member_id').limit(1);
  const { data: loan } = await supabase.from('loans').select('member_id').limit(1);
  
  if (pd && pd.length > 0) {
    console.log("pd_verifications member_id:", pd[0].member_id, "Type:", typeof pd[0].member_id);
  }
  if (loan && loan.length > 0) {
    console.log("loans member_id:", loan[0].member_id, "Type:", typeof loan[0].member_id);
  }
}

run();
