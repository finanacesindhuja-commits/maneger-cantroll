const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteSumathra() {
  const memberId = 45; // Sumathra V, member_no: LN-912548
  
  console.log(`Deleting all details for member_id: ${memberId}...`);

  // Delete from pd_verifications
  const { data: pd, error: pdErr } = await supabase
    .from('pd_verifications')
    .delete()
    .eq('member_id', memberId)
    .select();
  
  if (pdErr) console.error("Error deleting from pd_verifications:", pdErr.message);
  else console.log(`Deleted ${pd?.length || 0} records from pd_verifications.`);

  // Delete from loans
  const { data: loans, error: loansErr } = await supabase
    .from('loans')
    .delete()
    .eq('member_id', memberId)
    .select();
  
  if (loansErr) console.error("Error deleting from loans:", loansErr.message);
  else console.log(`Deleted ${loans?.length || 0} records from loans.`);

  // Delete from members
  const { data: members, error: membersErr } = await supabase
    .from('members')
    .delete()
    .eq('id', memberId)
    .select();
  
  if (membersErr) console.error("Error deleting from members:", membersErr.message);
  else console.log(`Deleted ${members?.length || 0} records from members.`);
  
  console.log("Deletion complete.");
}

deleteSumathra();
