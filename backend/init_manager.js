const { createClient } = require('@supabase/supabase-js');

const URL = 'https://ojhxryeefkzhgwxwgsxj.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaHhyeWVlZmt6aGd3eHdnc3hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg1NTEzNCwiZXhwIjoyMDg5NDMxMTM0fQ.ebd11rAKtb1n67IduQO8m5dWGzvf9S1ib1Fr_KQx5kY';

const supabase = createClient(URL, KEY);

async function fixManager() {
    console.log('Setting stf003 as Manager...');
    
    // Check if it exists
    const { data: existing } = await supabase
        .from('staff')
        .select('*')
        .ilike('staff_id', 'stf003')
        .single();
    
    if (existing) {
        console.log('User found. Updating role and password...');
        const { error } = await supabase
            .from('staff')
            .update({ role: 'Manager', password: 'manager123' })
            .eq('id', existing.id);
        
        if (error) console.error('Error:', error.message);
        else console.log('✅ stf003 updated to Manager with password: manager123');
    } else {
        console.log('User stf003 not found. Creating new Manager...');
        const { error } = await supabase
            .from('staff')
            .insert([{
                staff_id: 'STF003',
                name: 'Manager User',
                mobile: '0000000000',
                role: 'Manager',
                password: 'manager123',
                is_password_set: true
            }]);
        
        if (error) console.error('Error:', error.message);
        else console.log('✅ STF003 created as Manager with password: manager123');
    }
    process.exit(0);
}

fixManager();
