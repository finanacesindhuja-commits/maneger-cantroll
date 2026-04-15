const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
    console.log('Starting probe...');
    try {
        const commonTables = ['members', 'loans', 'installments', 'member_schedules', 'centers', 'staff', 'pd_verifications', 'collection_schedules', 'repayments'];
        console.log('Probing common table names...');
        for (const table of commonTables) {
            const { error: probeError, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
            if (!probeError) {
                console.log(`Table exists: ${table} (${count} rows)`);
            } else {
                console.log(`Table check failed for ${table}: ${probeError.message}`);
            }
        }
    } catch (e) {
        console.error('Critical probe error:', e);
    }
    process.exit(0);
}

listTables();
