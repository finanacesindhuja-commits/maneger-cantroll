const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('--- Checking collection_schedules ---');
    const { data, error } = await supabase.from('collection_schedules').select().limit(1);
    if (error) console.error('Error:', error.message);
    else if (data && data.length > 0) console.log('Columns:', Object.keys(data[0]));
    else console.log('Table is empty or columns not found');
}

check();
