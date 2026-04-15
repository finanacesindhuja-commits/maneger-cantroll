const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugData() {
    console.log('--- Debugging Loans ---');
    const { data: loans, error } = await supabase.from('loans').select('id, status, member_id, center_id');
    if (error) {
        console.error('Error fetching loans:', error.message);
    } else {
        console.log('Total Loans:', loans.length);
        const statusCounts = loans.reduce((acc, l) => {
            acc[l.status] = (acc[l.status] || 0) + 1;
            return acc;
        }, {});
        console.log('Status Counts:', statusCounts);
    }

    console.log('\n--- Debugging Collection Schedules ---');
    const { data: schedules, error: schError } = await supabase.from('collection_schedules').select('center_id');
    if (schError) {
        console.error('Error fetching schedules:', schError.message);
    } else {
        console.log('Active Schedules (Center IDs):', [...new Set(schedules.map(s => s.center_id))]);
    }
}

debugData();
