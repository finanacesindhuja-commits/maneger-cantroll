const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('--- Checking LOANS Table ---');
    const { data, error } = await supabase.from('loans').select().limit(1);
    
    if (error) {
        console.error('Error fetching loans:', error.message);
    } else if (data.length === 0) {
        console.log('Loans table is EMPTY.');
    } else {
        console.log('Columns found in loans:', Object.keys(data[0]));
        console.log('Row sample:', data[0]);
    }

    console.log('\n--- Checking CENTERS Table ---');
    const { data: cData, error: cError } = await supabase.from('centers').select().limit(1);
    if (cError) console.error('Error fetching centers:', cError.message);
    else if (cData.length === 0) console.log('Centers table is EMPTY.');
    else {
        console.log('Columns found in centers:', Object.keys(cData[0]));
        console.log('Row sample:', cData[0]);
    }
}

check();
