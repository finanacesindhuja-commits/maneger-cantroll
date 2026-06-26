const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupDummyData() {
  console.log('Cleaning up dummy data created for STF003...');
  
  // Get the centers created for STF003
  const { data: centers } = await supabase
    .from('centers')
    .select('id')
    .eq('staff_id', 'STF003');
    
  if (centers && centers.length > 0) {
    const centerIds = centers.map(c => c.id);
    
    // 1. Delete schedules for these centers
    await supabase.from('collection_schedules').delete().in('center_id', centerIds);
    
    // 2. Get members for these centers to delete loans and pd_verifications
    const { data: members } = await supabase.from('members').select('id').in('center_id', centerIds);
    if (members && members.length > 0) {
      const memberIds = members.map(m => m.id);
      await supabase.from('loans').delete().in('member_id', memberIds);
      await supabase.from('pd_verifications').delete().in('member_id', memberIds);
    }
    
    // 3. Delete members
    await supabase.from('members').delete().in('center_id', centerIds);
    
    // 4. Delete centers
    await supabase.from('centers').delete().eq('staff_id', 'STF003');
  }
  
  // 5. Delete staff STF003
  await supabase.from('staff').delete().eq('staff_id', 'STF003');
  
  console.log('✅ Dummy data cleaned up successfully!');
}

cleanupDummyData().catch(console.error);
