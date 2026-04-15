const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function diagnose() {
  console.log('--- Diagnosis for stf003 ---');
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('staff_id', 'stf003');
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  if (data.length === 0) {
    console.log('User stf003 NOT FOUND in staff table.');
  } else {
    const user = data[0];
    console.log('User found:', {
        staff_id: user.staff_id,
        role: user.role,
        has_password: !!user.password,
        name: user.name
    });
  }
  console.log('--- End ---');
}

diagnose();
