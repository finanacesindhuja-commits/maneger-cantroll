const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', SUPABASE_URL);
console.log('KEY:', SUPABASE_KEY ? 'EXISTS' : 'MISSING');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    try {
        const { data: loans, error: lErr } = await supabase.from('loans').select('id, status, disbursement_status');
        console.log('Loans Count:', loans ? loans.length : 'null');
        if (lErr) console.error('Loans Error:', lErr);
        if (loans) console.log('Loans Sample:', loans.slice(0, 5));

        const { data: centers, error: cErr } = await supabase.from('centers').select('id, name');
        console.log('Centers Count:', centers ? centers.length : 'null');
        if (cErr) console.error('Centers Error:', cErr);
    } catch (e) {
        console.error('Catch error:', e);
    }
}

check();
