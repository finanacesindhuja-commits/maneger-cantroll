const { createClient } = require('@supabase/supabase-js');

const URL = 'https://ojhxryeefkzhgwxwgsxj.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaHhyeWVlZmt6aGd3eHdnc3hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg1NTEzNCwiZXhwIjoyMDg5NDMxMTM0fQ.ebd11rAKtb1n67IduQO8m5dWGzvf9S1ib1Fr_KQx5kY';

const supabase = createClient(URL, KEY);

async function check() {
    console.log('Fetching stf003 info...');
    const { data, error } = await supabase
        .from('staff')
        .select('staff_id, role, password, name')
        .ilike('staff_id', 'stf003');
    
    if (error) {
        console.error('Error:', error.message);
    } else if (data.length === 0) {
        console.log('stf003 not found in staff table.');
    } else {
        console.log('Found user:', data[0]);
    }
    process.exit(0);
}

check();
