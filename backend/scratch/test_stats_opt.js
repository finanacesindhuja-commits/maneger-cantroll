require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const start = Date.now();
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const today = new Date().toISOString().split('T')[0];

  try {
    const [loansRes, pdRes, schedulesRes] = await Promise.all([
      supabase.from('loans').select('center_id, member_id, status, amount_sanctioned, credited_at, disbursement_app_status'),
      supabase.from('pd_verifications').select('member_id').or('status.ilike.APPROVED,pd_verified.eq.true'),
      supabase.from('collection_schedules').select('center_id, amount, status, scheduled_date')
    ]);

    if (loansRes.error) throw loansRes.error;
    if (pdRes.error) throw pdRes.error;
    if (schedulesRes.error) throw schedulesRes.error;

    const allLoans = loansRes.data || [];
    const pdData = pdRes.data || [];
    const allSchedules = schedulesRes.data || [];

    // Filter and compute in memory
    const creditedLoans = allLoans.filter(l => 
      ['CREDITED', 'DISBURSED', 'COMPLETED'].includes(l.status) && 
      l.credited_at >= startOfMonth.toISOString()
    );
    const pendingLoans = allLoans.filter(l => 
      l.disbursement_app_status === 'READY' && 
      l.status !== 'CREDITED' && 
      l.status !== 'COMPLETED'
    );
    const readyForPdLoansRaw = allLoans.filter(l => l.status === 'READY FOR PD');
    const psLoans = allLoans.filter(l => l.status === 'APPROVED');
    const crLoans = allLoans.filter(l => l.status === 'CREDITED');

    const totalCredited = creditedLoans.reduce((sum, l) => sum + (Number(l.amount_sanctioned) || 0), 0);
    const pendingDisbursement = pendingLoans.reduce((sum, l) => sum + (Number(l.amount_sanctioned) || 0), 0);

    const approvedMemberIds = new Set(pdData.map(pd => String(pd.member_id)).filter(Boolean));

    const readyLoans = readyForPdLoansRaw.filter(l => approvedMemberIds.has(String(l.member_id)));
    const readyForPdLoansCount = readyLoans.length;
    const readyForPdCenterIds = readyLoans.map(l => l.center_id);

    const approvedMemberCount = psLoans.length;
    const memberCount = approvedMemberCount + readyForPdLoansCount;

    const pendingSanctionCenters = [...new Set([...psLoans.map(l => l.center_id), ...readyForPdCenterIds].filter(Boolean))].length;

    const scheduledCenterIds = new Set(allSchedules.map(s => s.center_id).filter(Boolean));
    const pendingScheduleCenters = [...new Set(crLoans.map(l => l.center_id).filter(Boolean))]
      .filter(id => !scheduledCenterIds.has(id)).length;

    const pendingCollectionCount = allSchedules.filter(s => s.status !== 'Received' && s.scheduled_date === today).length;
    const missingAmount = allSchedules.filter(s => s.status !== 'Received' && s.scheduled_date <= today)
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const result = {
      totalDisbursed: totalCredited,
      pendingDisbursement: pendingDisbursement,
      totalApprovedMembers: memberCount || 0,
      pendingSanctionCount: pendingSanctionCenters,
      pendingScheduleCount: pendingScheduleCenters,
      pendingCollectionCount: pendingCollectionCount || 0,
      missingAmount: missingAmount
    };

    console.log(`Optimized query finished in ${Date.now() - start}ms`);
    console.log("Result:", result);
  } catch (err) {
    console.error(err);
  }
}

run();
