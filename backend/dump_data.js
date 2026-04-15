const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(URL, KEY);

async function dump() {
    console.log('--- PD Verifications ---');
    const { data: pds } = await supabase.from('pd_verifications').select('*').limit(10);
    console.log(JSON.stringify(pds, null, 2));

    console.log('\n--- Members ---');
    const { data: members } = await supabase.from('members').select('*').limit(10);
    console.log(JSON.stringify(members, null, 2));

    process.exit(0);
}
dump();
