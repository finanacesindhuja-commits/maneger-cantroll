const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function dump() {
    console.log('--- CENTERS ---');
    const { data: centers, error: cErr } = await supabase.from('centers').select('*').limit(5);
    console.log(centers || cErr);

    console.log('--- LOANS ---');
    const { data: loans, error: lErr } = await supabase.from('loans').select('*').limit(5);
    console.log(loans || lErr);
}

dump();
