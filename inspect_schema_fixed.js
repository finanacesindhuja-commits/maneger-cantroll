const { createClient } = require('@supabase/supabase-js');

// Constants found in .env
const SUPABASE_URL = 'https://ojhxryeefkzhgwxwgsxj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaHhyeWVlZmt6aGd3eHdnc3hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg1NTEzNCwiZXhwIjoyMDg5NDMxMTM0fQ.ebd11rAKtb1n67IduQO8m5dWGzvf9S1ib1Fr_KQx5kY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectTable() {
  console.log('🔍 Inspecting collection_schedules table...');
  const { data, error } = await supabase
    .from('collection_schedules')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error selecting *:', error.message);
    
    // Try specifically selecting loan_id (the hint)
    console.log('🔍 Trying to select loan_id specifically...');
    const { data: d2, error: e2 } = await supabase.from('collection_schedules').select('loan_id').limit(1);
    if (e2) console.error('❌ loan_id also fails:', e2.message);
    else console.log('✅ loan_id exists!');

    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Columns found:', Object.keys(data[0]));
  } else {
    console.log('⚠️ No data in table.');
  }
}

inspectTable();
