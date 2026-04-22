const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStaff() {
  const { data, error } = await supabase
    .from('staff')
    .select('*');
  
  if (error) {
    console.error('Error fetching staff:', error);
    return;
  }
  
  console.log('Current Staff Records:');
  console.table(data.map(s => ({ 
    staff_id: s.staff_id, 
    role: s.role, 
    name: s.name,
    branch: s.branch
  })));
}

checkStaff();
