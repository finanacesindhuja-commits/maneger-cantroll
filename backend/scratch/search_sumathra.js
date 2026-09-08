const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function searchAndDelete() {
  const lnNumber = 'LN-912548';
  const name = 'Sumathra V';

  console.log(`Searching for member with LN Number: ${lnNumber} or Name: ${name}...`);

  // Try to find in loans
  const { data: loans, error: loansErr } = await supabase
    .from('loans')
    .select('*')
    .or(`loan_no.eq.${lnNumber},member_id.in.(select id from members where name.ilike.%${name}%)`);
  
  if (loansErr) console.error("Error querying loans:", loansErr.message);
  else console.log("Found in loans:", loans);

  // Try to find in members
  const { data: members, error: membersErr } = await supabase
    .from('members')
    .select('*')
    .ilike('name', `%${name}%`);
  
  if (membersErr) console.error("Error querying members:", membersErr.message);
  else console.log("Found in members:", members);

  // You can also try searching by loan_no in members if it exists
  const { data: members2, error: membersErr2 } = await supabase
    .from('members')
    .select('*')
    .eq('loan_no', lnNumber);
    
  if (membersErr2 && !membersErr2.message.includes('column "loan_no" does not exist')) {
    console.error("Error querying members by loan_no:", membersErr2.message);
  } else if (members2 && members2.length > 0) {
    console.log("Found in members by loan_no:", members2);
  }

}

searchAndDelete();
