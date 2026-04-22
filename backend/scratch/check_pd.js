const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: pd } = await supabase.from('pd_verifications').select('*');
  console.log('Total PD Verifications:', pd?.length);
  
  const approvedPDs = pd?.filter(p => p.status === 'APPROVED' || String(p.pd_verified).toLowerCase() === 'true');
  console.log('Approved PDs:', approvedPDs?.length);
  if (approvedPDs?.length > 0) {
    console.log('Sample Approved PD:', approvedPDs[0]);
    
    // Check corresponding loans
    const memberIds = approvedPDs.map(p => p.member_id);
    const { data: loans } = await supabase.from('loans').select('id, member_id, status').in('member_id', memberIds);
    console.log('Loans for these Approved PDs:', loans);
  }
}
test();
