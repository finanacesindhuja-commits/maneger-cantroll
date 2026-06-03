require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function timeOperation(label, operation) {
  const start = Date.now();
  try {
    await operation();
    console.log(`${label}: ${Date.now() - start}ms`);
  } catch (err) {
    console.error(`Error during ${label}:`, err.message);
  }
}

async function run() {
  console.log("Starting DB operations timing...");
  
  // Test login query
  await timeOperation("Login Query", async () => {
    await supabase
      .from('staff')
      .select('*')
      .eq('staff_id', 'STAFF01')
      .eq('password', '1234')
      .eq('role', 'Manager')
      .single();
  });

  // Test stats components
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const today = new Date().toISOString().split('T')[0];

  await timeOperation("stats query 1 (credited loans)", () => 
    supabase
      .from('loans')
      .select('amount_sanctioned')
      .in('status', ['CREDITED', 'DISBURSED', 'COMPLETED'])
      .gte('credited_at', startOfMonth.toISOString())
  );

  await timeOperation("stats query 2 (pending loans)", () => 
    supabase
      .from('loans')
      .select('amount_sanctioned')
      .eq('disbursement_app_status', 'READY')
      .neq('status', 'CREDITED')
      .neq('status', 'COMPLETED')
  );

  await timeOperation("stats query 3 (pd verifications)", () => 
    supabase
      .from('pd_verifications')
      .select('member_id')
      .or('status.ilike.APPROVED,pd_verified.eq.true')
  );

  await timeOperation("stats query 4 (ready loans)", () => 
    supabase
      .from('loans')
      .select('center_id, member_id')
      .eq('status', 'READY FOR PD')
  );

  await timeOperation("stats query 5 (approved loans)", () => 
    supabase
      .from('loans')
      .select('center_id')
      .eq('status', 'APPROVED')
  );

  await timeOperation("stats query 6 (credited loans 2)", () => 
    supabase
      .from('loans')
      .select('center_id')
      .eq('status', 'CREDITED')
  );

  await timeOperation("stats query 7 (schedules)", () => 
    supabase
      .from('collection_schedules')
      .select('center_id')
  );

  await timeOperation("stats query 8 (missing collections)", () => 
    supabase
      .from('collection_schedules')
      .select('amount')
      .neq('status', 'Received')
      .lte('scheduled_date', today)
  );

  await timeOperation("stats query 9 (schedules today exact count)", () => 
    supabase
      .from('collection_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('scheduled_date', today)
      .neq('status', 'Received')
  );

  await timeOperation("Parallel Promise.all for stats", () => 
    Promise.all([
      supabase.from('loans').select('amount_sanctioned').in('status', ['CREDITED', 'DISBURSED', 'COMPLETED']).gte('credited_at', startOfMonth.toISOString()),
      supabase.from('loans').select('amount_sanctioned').eq('disbursement_app_status', 'READY').neq('status', 'CREDITED').neq('status', 'COMPLETED'),
      supabase.from('pd_verifications').select('member_id').or('status.ilike.APPROVED,pd_verified.eq.true'),
      supabase.from('loans').select('center_id, member_id').eq('status', 'READY FOR PD'),
      supabase.from('loans').select('center_id').eq('status', 'APPROVED'),
      supabase.from('loans').select('center_id').eq('status', 'CREDITED'),
      supabase.from('collection_schedules').select('center_id'),
      supabase.from('collection_schedules').select('amount').neq('status', 'Received').lte('scheduled_date', today),
      supabase.from('collection_schedules').select('*', { count: 'exact', head: true }).eq('scheduled_date', today).neq('status', 'Received')
    ])
  );
}

run();
