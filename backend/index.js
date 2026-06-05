const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const compression = require('compression');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 15 }); // Cache for 15 seconds

const flushCache = () => cache.flushAll();

const activePromises = new Map();
async function coalesceRequest(key, fn) {
  if (activePromises.has(key)) {
    return activePromises.get(key);
  }
  const promise = fn().finally(() => activePromises.delete(key));
  activePromises.set(key, promise);
  return promise;
}

const cacheMiddleware = (duration = 15) => (req, res, next) => {
  if (req.method !== 'GET') return next();
  const key = req.originalUrl;
  const cachedResponse = cache.get(key);
  if (cachedResponse) {
    return res.json(cachedResponse);
  } else {
    res.sendResponse = res.json;
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body, duration);
      }
      res.sendResponse(body);
    };
    next();
  }
};

app.use(compression());
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN,
  'https://maneger-cantroll.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Global cache invalidation on successful mutations
app.use((req, res, next) => {
  res.on('finish', () => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) && res.statusCode >= 200 && res.statusCode < 300) {
      flushCache();
    }
  });
  next();
});
const PORT = process.env.PORT || 5001;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Manager Control Backend is running' });
});

app.post('/api/login', async (req, res) => {
  const { staffId, password, role } = req.body;
  console.log('Login attempt:', { staffId, role });

  if (!staffId || !password) {
    return res.status(400).json({ message: 'Staff ID and password are required' });
  }

  // Strictly check for Manager role as requested by user
  if (role !== 'Manager') {
    return res.status(403).json({ message: 'Access denied. Managers only.' });
  }

  try {
    // Strictly verify credentials against the Supabase staff table
    // Using eq with uppercase for fast case-normalized matching
    const { data: user, error: dbError } = await supabase
      .from('staff')
      .select('*')
      .eq('staff_id', String(staffId || '').trim().toUpperCase())
      .eq('password', String(password || '').trim())
      .eq('role', 'Manager')
      .single();

    if (dbError || !user) {
      console.warn('Login failed for:', staffId);

      // Diagnostic: Check if user exists with ANY role
      const { data: anyUser } = await supabase
        .from('staff')
        .select('role, staff_id')
        .eq('staff_id', String(staffId || '').trim().toUpperCase())
        .eq('password', String(password || '').trim())
        .single();

      if (anyUser) {
        console.log(`User ${staffId} found but has role: ${anyUser.role}. Expected: Manager`);
      } else {
        console.log(`User ${staffId} not found with provided password.`);
      }

      if (dbError) console.error('Database Error:', dbError.message);
      return res.status(401).json({ message: 'Invalid Manager credentials' });
    }

    return res.status(200).json({
      message: 'Login successful',
      role: user.role,
      staffId: user.staff_id,
      name: user.name,
      branch: user.branch
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Reusable helper to fetch all records by handling PostgREST default limit (1000) through range pagination
async function fetchAll(queryFn) {
  let allData = [];
  let offset = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await queryFn().range(offset, offset + limit - 1);
    if (error) throw error;
    if (data && data.length > 0) {
      allData = allData.concat(data);
      offset += limit;
      if (data.length < limit) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }
  return allData;
}

// Fetch stats for the dashboard and sidebar indicators
app.get('/api/stats', cacheMiddleware(10), async (req, res) => {
  try {
    const data = await coalesceRequest('stats', async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const today = new Date().toISOString().split('T')[0];

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
      const unpaidAmount = allSchedules.filter(s => s.status !== 'Received' && s.status !== 'Paid' && s.scheduled_date <= today)
        .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

      return {
        totalDisbursed: totalCredited,
        pendingDisbursement: pendingDisbursement,
        totalApprovedMembers: memberCount || 0,
        pendingSanctionCount: pendingSanctionCenters,
        pendingScheduleCount: pendingScheduleCenters,
        pendingCollectionCount: pendingCollectionCount || 0,
        missingAmount: missingAmount,
        unpaidAmount: unpaidAmount
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch specific profile (used when name is missing in localStorage)
app.get('/api/profile/:staffId', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('staff')
      .select('name, staff_id, role, branch')
      .ilike('staff_id', req.params.staffId)
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: 'Profile not found' });
  }
});

// Fetch centers with active loan activity
app.get('/api/centers', cacheMiddleware(10), async (req, res) => {
  try {
    const data = await coalesceRequest('centers', async () => {
      // Fetch all required data concurrently for maximum performance
      const [pdData, regularLoans, readyLoansRaw, staffData, allMembers, allCenters] = await Promise.all([
        fetchAll(() => 
          supabase
            .from('pd_verifications')
            .select('member_id')
            .or('status.ilike.APPROVED,pd_verified.eq.true')
        ),
        fetchAll(() => 
          supabase
            .from('loans')
            .select('center_id, status, amount_sanctioned, member_id, disbursement_app_status')
            .in('status', ['APPROVED', 'SANCTIONED', 'CREDITED', 'DISBURSED'])
        ),
        fetchAll(() => 
          supabase
            .from('loans')
            .select('center_id, status, amount_sanctioned, member_id, disbursement_app_status')
            .eq('status', 'READY FOR PD')
        ),
        supabase
          .from('staff')
          .select('staff_id, branch'),
        fetchAll(() => 
          supabase
            .from('members')
            .select('id, center_id')
        ),
        supabase
          .from('centers')
          .select('*')
      ]);

      if (staffData.error) throw staffData.error;
      if (allCenters.error) throw allCenters.error;

      const approvedMemberIds = (pdData || []).map(pd => String(pd.member_id)).filter(Boolean);
      const approvedMemberSet = new Set(approvedMemberIds);

      // Filter ready loans in memory (using explicit String type casting)
      const readyLoans = (readyLoansRaw || []).filter(l => approvedMemberSet.has(String(l.member_id)));

      const activeLoans = [...(regularLoans || []), ...readyLoans];

      if (!activeLoans || activeLoans.length === 0) {
        return [];
      }

      const readyCenterIds = new Set(activeLoans.map(l => l.center_id).filter(Boolean));

      // Filter centers in memory and sort by name
      const centers = (allCenters.data || [])
        .filter(c => readyCenterIds.has(c.id));
      centers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      const branchMap = {};
      if (staffData.data) {
        staffData.data.forEach(s => {
          if (s.staff_id) branchMap[s.staff_id] = s.branch;
        });
      }

      // 3. Attach stage info, branch, and stats to centers
      const enrichedCenters = centers.map(c => {
        const centerLoans = activeLoans.filter(l => l.center_id === c.id);
        const centerMembers = (allMembers || []).filter(m => String(m.center_id) === String(c.id));
        
        // Group completion check: Are all members in this center PD approved?
        // Normalize both IDs to strings for comparison
        const approvedMembersInCenter = centerMembers.filter(m => 
          approvedMemberIds.some(aid => String(aid) === String(m.id))
        );
        const isPDComplete = centerMembers.length > 0 && approvedMembersInCenter.length === centerMembers.length;

        // Stage logic
        const isReadyForPd = centerLoans.some(l => l.status === 'READY FOR PD');
        const isApproved = centerLoans.some(l => l.status === 'APPROVED');
        const isSanctioned = centerLoans.some(l => l.status === 'SANCTIONED');
        
        // Strict Check: ALL members must be CREDITED or DISBURSED, and at least one must be CREDITED (not yet scheduled)
        const hasCredited = centerLoans.some(l => l.status === 'CREDITED');
        const allProcessed = centerLoans.length > 0 && centerLoans.every(l => 
          ['CREDITED', 'DISBURSED'].includes(l.status)
        );
        const isCredited = allProcessed && hasCredited;

        const stage = isReadyForPd ? 'PD' : isApproved ? 'APPROVAL' : isSanctioned ? 'DISBURSEMENT' : isCredited ? 'READY_TO_SCHEDULE' : 'PENDING';

        // Statistics: Only sum loans that are part of the current stage
        // If we are ready to schedule, only sum the CREDITED loans
        const relevantLoans = isCredited 
          ? centerLoans.filter(l => l.status === 'CREDITED')
          : centerLoans;
        const totalAmount = relevantLoans.reduce((sum, l) => sum + (Number(l.amount_sanctioned || 0)), 0);

        return {
          ...c,
          branch: branchMap[c.staff_id] || 'N/A',
          amount: totalAmount,
          canSanction: isPDComplete && (isApproved || isReadyForPd),
          canSchedule: isCredited,
          isWaitingCredit: isSanctioned && !isCredited,
          membersCount: centerLoans.length,
          totalMembersInGroup: centerMembers.length,
          approvedMembersCount: approvedMembersInCenter.length,
          isPDComplete,
          stage: stage
        };
      });

      return enrichedCenters;
    });

    res.json(data);
  } catch (error) {
    console.error('Centers fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});


// New Endpoint: Track all sanctioned centers and their disbursement status
app.get('/api/loans/track-disbursement', cacheMiddleware(10), async (req, res) => {
  try {
    // 1. Fetch PD verifications that are approved
    const { data: pdData } = await supabase
      .from('pd_verifications')
      .select('member_id')
      .or('status.ilike.APPROVED,pd_verified.eq.true');
    const approvedMemberIds = new Set((pdData || []).map(pd => String(pd.member_id)).filter(Boolean));

    // 2. Fetch loans in 'APPROVED', 'READY FOR PD', 'SANCTIONED', or 'CREDITED' state
    const { data, error } = await supabase
      .from('loans')
      .select('center_id, status, amount_sanctioned, member_id, scheme_name, disbursement_app_status')
      .in('status', ['APPROVED', 'READY FOR PD', 'SANCTIONED', 'CREDITED']);

    if (error) throw error;

    // Filter out 'READY FOR PD' loans that are not approved by PD verification
    const filteredLoans = (data || []).filter(l => {
      if (l.status === 'READY FOR PD') {
        return approvedMemberIds.has(String(l.member_id));
      }
      return true;
    });

    // Group by center
    const centerGroups = filteredLoans.reduce((acc, l) => {
      const cid = l.center_id;
      if (!cid) return acc;

      if (!acc[cid]) {
        acc[cid] = {
          centerId: cid,
          totalAmount: 0,
          status: 'Stored',
          members: 0,
          scheme: l.scheme_name || 'N/A',
          dbStatus: l.disbursement_app_status
        };
      }
      acc[cid].members += 1;

      // Determine display status based on database columns
      let currentStatus = 'Stored';
      if (l.status === 'APPROVED' || l.status === 'READY FOR PD') {
        currentStatus = 'Pending Sanction';
      } else if (l.status === 'DISBURSED') {
        currentStatus = 'Active & Scheduled';
      } else if (l.status === 'CREDITED') {
        currentStatus = 'Credited';
      } else if (l.disbursement_app_status === 'READY') {
        currentStatus = 'Sent (Waiting Credit)';
      } else {
        currentStatus = 'Stored';
      }

      // Priority ordering for center status (display most urgent state)
      const statusPriority = {
        'Pending Sanction': 4,
        'Stored': 3,
        'Sent (Waiting Credit)': 2,
        'Credited': 1,
        'Active & Scheduled': 0
      };

      if (!acc[cid].currentStatusPriority || statusPriority[currentStatus] > acc[cid].currentStatusPriority) {
        acc[cid].status = currentStatus;
        acc[cid].currentStatusPriority = statusPriority[currentStatus];
      }

      // Accumulate the amount sanctioned (for APPROVED/READY FOR PD, this is null/0)
      acc[cid].totalAmount += (Number(l.amount_sanctioned) || 0);

      // Map scheme name
      if (acc[cid].status === 'Pending Sanction') {
        acc[cid].scheme = 'Waiting Sanction';
      } else if (l.scheme_name) {
        acc[cid].scheme = l.scheme_name;
      }

      return acc;
    }, {});

    if (Object.keys(centerGroups).length === 0) {
      return res.json([]);
    }

    // Fetch center mapping to get staff_id, then staff to get branch
    const { data: centerDetails } = await supabase
      .from('centers')
      .select('id, name, staff_id')
      .in('id', Object.keys(centerGroups));

    const { data: staffList } = await supabase
      .from('staff')
      .select('staff_id, branch');

    const staffBranchMap = {};
    if (staffList) staffList.forEach(s => staffBranchMap[s.staff_id] = s.branch);

    const result = Object.values(centerGroups).map(g => {
      const center = centerDetails?.find(cn => cn.id === g.centerId);
      return {
        ...g,
        centerName: center?.name || 'Unknown',
        branch: staffBranchMap[center?.staff_id] || 'N/A'
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch the sanctioned amount for a center (from the latest credited loan)
app.get('/api/centers/:id/sanctioned-amount', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('amount_sanctioned')
      .eq('center_id', id)
      .eq('disbursement_status', 'CREDITED')
      .order('credited_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    res.json({ amount: data?.amount_sanctioned || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1. Fetch loans that are APPROVED (by PD) but NOT YET SANCTIONED (by Manager)
app.get('/api/loans/sanction-queue', cacheMiddleware(10), async (req, res) => {
  try {
    const [pdData, approvedLoans, readyLoansRaw] = await Promise.all([
      fetchAll(() => 
        supabase
          .from('pd_verifications')
          .select('member_id')
          .or('status.ilike.APPROVED,pd_verified.eq.true')
      ),
      fetchAll(() => 
        supabase
          .from('loans')
          .select('*, members(member_no)')
          .eq('status', 'APPROVED')
      ),
      fetchAll(() => 
        supabase
          .from('loans')
          .select('*, members(member_no)')
          .eq('status', 'READY FOR PD')
      )
    ]);

    const approvedMemberIds = new Set((pdData || []).map(pd => String(pd.member_id)).filter(Boolean));

    // Filter in-memory
    const readyLoans = (readyLoansRaw || []).filter(l => approvedMemberIds.has(String(l.member_id)));

    const loans = [...(approvedLoans || []), ...readyLoans];

    const formatted = loans.map(l => ({
      ...l,
      member_no: l.members?.member_no || l.id
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Sanction queue error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Sanction all loans in a center (Step 1 of Manager Workflow)
app.post('/api/centers/:id/sanction', async (req, res) => {
  const { id } = req.params;
  const { amountSanctioned, schemeName, staffId } = req.body;
  try {
    const { data: pdData } = await supabase
      .from('pd_verifications')
      .select('member_id')
      .eq('center_id', id)
      .or('status.ilike.APPROVED,pd_verified.eq.true');
    const approvedMemberIds = (pdData || []).map(pd => Number(pd.member_id)).filter(Boolean);

    const { data: alreadyApprovedLoans, error: err1 } = await supabase
      .from('loans')
      .select('id')
      .eq('center_id', id)
      .eq('status', 'APPROVED');

    if (err1) throw err1;

    let readyLoans = [];
    if (approvedMemberIds.length > 0) {
      const { data: rLoans, error: err2 } = await supabase
        .from('loans')
        .select('id')
        .eq('status', 'READY FOR PD')
        .in('member_id', approvedMemberIds);
      if (err2) throw err2;
      readyLoans = rLoans || [];
    }

    const approvedLoans = [...(alreadyApprovedLoans || []), ...readyLoans];

    if (approvedLoans.length === 0) {
      return res.status(404).json({ error: 'No PD-Approved loans found for this center' });
    }

    const loanIds = approvedLoans.map(l => l.id);

    // 2. Bulk update them to SANCTIONED (Stored state)
    const { data, error } = await supabase
      .from('loans')
      .update({
        status: 'SANCTIONED',
        amount_sanctioned: amountSanctioned,
        scheme_name: schemeName,
        sanctioned_at: new Date().toISOString(),
        disbursement_app_status: 'STORED'
      })
      .in('id', loanIds)
      .select();

    if (error) throw error;
    res.json({ message: `Successfully sanctioned ${data.length} loans. Stored in Supabase.`, count: data.length });
  } catch (error) {
    console.error('Bulk sanction error:', error);
    res.status(500).json({ error: error.message });
  }
});

// New Endpoint: Send a sanctioned center to the disbursement app
app.post('/api/centers/:id/send-to-disbursement', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('loans')
      .update({ disbursement_app_status: 'READY' })
      .eq('center_id', id)
      .eq('status', 'SANCTIONED');

    if (error) throw error;
    res.json({ message: 'Scheme sent to Disbursement app successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update center meeting day
app.put('/api/centers/:id', async (req, res) => {
  const { id } = req.params;
  const { meeting_day } = req.body;
  try {
    const { data, error } = await supabase
      .from('centers')
      .update({ meeting_day })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch all collection schedules (Consolidated & Enriched)
app.get('/api/schedules', cacheMiddleware(10), async (req, res) => {
  try {
    const { data: schedules, error: schError } = await supabase
      .from('collection_schedules')
      .select('*')
      .order('scheduled_date', { ascending: false });

    if (schError) throw schError;

    // Fetch all needed mapping data in parallel
    const [centersRes, staffRes] = await Promise.all([
      supabase.from('centers').select('id, staff_id'),
      supabase.from('staff').select('staff_id, branch, name')
    ]);

    if (centersRes.error) console.error('Centers mapping error:', centersRes.error);
    if (staffRes.error) console.error('Staff mapping error:', staffRes.error);

    const centers = centersRes.data || [];
    const staffList = staffRes.data || [];

    // Create lookup maps with extreme normalization
    const centerToStaffMap = {};
    centers.forEach(c => {
      if (c.id) {
        const cidKey = String(c.id).trim().toLowerCase();
        centerToStaffMap[cidKey] = c.staff_id;
      }
    });

    const staffInfoMap = {};
    staffList.forEach(st => {
      if (st.staff_id) {
        const sidKey = String(st.staff_id).trim().toLowerCase();
        staffInfoMap[sidKey] = {
          branch: st.branch,
          name: st.name
        };
      }
    });

    // Enrich schedules with staff details
    const enriched = (schedules || []).map(s => {
      const cidKey = s.center_id ? String(s.center_id).trim().toLowerCase() : null;
      const staffId = cidKey ? centerToStaffMap[cidKey] : null;
      const sidKey = staffId ? String(staffId).trim().toLowerCase() : null;
      const info = sidKey ? staffInfoMap[sidKey] : null;
      
      return {
        ...s,
        staff_id: staffId ? String(staffId).trim() : 'N/A',
        staff_name: info?.name || 'Unknown',
        branch: info?.branch || 'N/A'
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Schedule enrichment critical error:', error);
    res.status(500).json({ error: error.message });
  }
});

const GOVT_HOLIDAYS_2026 = [
  '2026-01-01', // New Year's Day
  '2026-01-15', // Pongal
  '2026-01-16', // Thiruvalluvar Day
  '2026-01-17', // Uzhavar Thirunal
  '2026-01-26', // Republic Day
  '2026-02-01', // Thai Poosam
  '2026-03-19', // Telugu New Year's Day
  '2026-03-21', // Ramzan (Id-ul-Fitr)
  '2026-03-31', // Mahavir Jayanti
  '2026-04-03', // Good Friday
  '2026-04-14', // Tamil New Year / Dr. Ambedkar Jayanti
  '2026-05-01', // May Day
  '2026-05-28', // Bakrid (Id-ul-Zuha)
  '2026-06-26', // Muharram
  '2026-08-15', // Independence Day
  '2026-08-26', // Milad-un-Nabi
  '2026-09-04', // Krishna Jayanti
  '2026-09-14', // Vinayakar Chathurthi
  '2026-10-02', // Gandhi Jayanti
  '2026-10-18', // Ayutha Pooja
  '2026-10-19', // Vijaya Dashami
  '2026-11-08', // Deepavali
  '2026-12-25'  // Christmas Day
];

// Create a new collection schedule (Supports Multi-Week Plans & Grouping)
app.post('/api/schedules', async (req, res) => {
  const { centerId, centerName, scheduledDate, amount } = req.body;
  const amtStr = String(amount);

  // Define Loan Plans
  const loanPlans = {
    "10000": {
      name: "₹10,000 (12-Week Plan)",
      weeks: 12,
      amounts: [1100, 1100, 1100, 1100, 1080, 1080, 1080, 1080, 1070, 1070, 1070, 1070]
    },
    "12000": {
      name: "₹12,000 (16-Week Plan)",
      weeks: 16,
      amounts: [
        1050, 1050, 1050, 1050,
        1020, 1020, 1020, 1020,
        980, 980, 980, 980,
        950, 950, 950, 950
      ]
    },
    "13000": {
      name: "₹13,000 (18-Week Plan)",
      weeks: 18,
      amounts: [
        990, 990, 990, 990,
        970, 970, 970, 970,
        940, 940, 940, 940,
        910, 910, 910, 910,
        890, 890
      ]
    }
  };

  try {
    // 0. Fetch custom holidays from Supabase to merge with fallback list
    let dbHolidays = [];
    try {
      const { data: hData, error: hError } = await supabase
        .from('holidays')
        .select('holiday_date');
      if (!hError && hData) {
        dbHolidays = hData.map(h => h.holiday_date);
      }
    } catch (hErr) {
      console.warn('Could not fetch custom holidays from DB, using fallback list:', hErr.message);
    }

    const isHoliday = (dateStr) => {
      return GOVT_HOLIDAYS_2026.includes(dateStr) || dbHolidays.includes(dateStr);
    };

    const weekdaysArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const getAdjustedDate = (baseDate) => {
      let tempDate = new Date(baseDate);
      while (true) {
        const year = tempDate.getFullYear();
        const month = String(tempDate.getMonth() + 1).padStart(2, '0');
        const day = String(tempDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const dayOfWeek = tempDate.getDay(); // 0 = Sunday

        if (dayOfWeek === 0 || isHoliday(dateStr)) {
          // Shift 1 day before
          tempDate.setDate(tempDate.getDate() - 1);
        } else {
          return {
            dateStr,
            dayName: weekdaysArr[dayOfWeek]
          };
        }
      }
    };

    // 1. Get all eligible loans for this center that are in 'CREDITED' state
    const { data: loansToActivate, error: loanFetchError } = await supabase
      .from('loans')
      .select('id, member_name, amount_sanctioned')
      .eq('center_id', Number(centerId))
      .eq('status', 'CREDITED');

    if (loanFetchError) throw loanFetchError;

    // 2. Update their status to DISBURSED
    if (loansToActivate && loansToActivate.length > 0) {
      const loanIds = loansToActivate.map(l => l.id);
      const { error: activeError } = await supabase
        .from('loans')
        .update({ status: 'DISBURSED' })
        .in('id', loanIds);

      if (activeError) console.error('Activation error during scheduling:', activeError);
    }

    // 3. Update Center Meeting Day based on the selected date
    const centerDate = new Date(scheduledDate);
    const centerMeetingDay = weekdaysArr[centerDate.getDay()];

    await supabase
      .from('centers')
      .update({ meeting_day: centerMeetingDay })
      .eq('id', Number(centerId));

    // 4. Generate Weekly Collections PER MEMBER as 'Approved'
    const results = [];
    const errors = [];

    // Loop through each member
    for (const loan of (loansToActivate || [])) {
      const memberAmount = Number(loan.amount_sanctioned) || 10000;
      
      let memberPlan;
      let multiplier = 1;
      let iterations = 12;
      
      if (loanPlans[String(memberAmount)]) {
        // If there's an exact plan match (e.g. 10000, 12000), use its exact amounts
        memberPlan = loanPlans[String(memberAmount)];
        iterations = memberPlan.weeks;
        multiplier = 1; // Exact match, no scaling needed
      } else {
        // Fallback to 10k plan scaled up
        memberPlan = loanPlans["10000"];
        iterations = 12;
        multiplier = memberAmount / 10000;
      }

      // Generate all weeks for this specific member
      for (let i = 0; i < iterations; i++) {
        const baseDate = new Date(scheduledDate);
        baseDate.setDate(baseDate.getDate() + (i * 7));

        const adjusted = getAdjustedDate(baseDate);
        const finalSchDate = adjusted.dateStr;
        const scheduledDayName = adjusted.dayName;

        // Calculate member-specific installment for this week
        const currentAmount = memberPlan.amounts[i] * multiplier;

        const { data: schedule, error } = await supabase
          .from('collection_schedules')
          .insert([{
            center_id: Number(centerId),
            center_name: centerName,
            member_id: loan.id,
            member_name: loan.member_name,
            week_number: i + 1,
            scheduled_date: finalSchDate,
            scheduled_day: scheduledDayName,
            amount: currentAmount,
            status: 'Approved'
          }])
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          errors.push(error.message);
        } else {
          results.push(schedule);
        }
      }
    }

    res.json({
      message: `Center Activated! Generated ${results.length} member-level schedules for ${centerMeetingDay}s.`,
      count: results.length,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    console.error('SCHEDULE CREATE CRITICAL ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});


// Approve a collection schedule (Supports Bulk Approval via plan_id)
app.put('/api/schedules/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { staffId } = req.body;
  try {
    const { data, error } = await supabase
      .from('collection_schedules')
      .update({
        status: 'Approved',
        approved_at: new Date().toISOString(),
        approved_by: staffId
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject a collection schedule (Supports Bulk Rejection via plan_id)
app.put('/api/schedules/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { staffId } = req.body;
  try {
    const { data, error } = await supabase
      .from('collection_schedules')
      .update({
        status: 'Rejected',
        approved_at: new Date().toISOString(),
        approved_by: staffId
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all schedules for a center on a specific date as received
app.put('/api/schedules/receive-bulk', async (req, res) => {
  const { centerId, scheduledDate, staffId } = req.body;
  try {
    const { data, error } = await supabase
      .from('collection_schedules')
      .update({
        status: 'Received',
        approved_by: staffId,
        approved_at: new Date().toISOString()
      })
      .eq('center_id', centerId)
      .eq('scheduled_date', scheduledDate)
      .neq('status', 'Received')
      .select();

    if (error) throw error;
    res.json({ message: `Successfully received ${data.length} schedules`, count: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk receive for all centers under a staff for a specific date
app.put('/api/schedules/receive-staff-bulk', async (req, res) => {
  const { staffId, scheduledDate, managerId } = req.body;
  
  if (!staffId || !scheduledDate) {
    return res.status(400).json({ error: 'Missing staffId or scheduledDate' });
  }

  try {
    // 1. Find centers belonging to this staff
    const { data: centers } = await supabase
      .from('centers')
      .select('id')
      .eq('staff_id', staffId);

    if (!centers || centers.length === 0) {
      return res.json({ message: 'No centers found for this staff', count: 0 });
    }

    const centerIds = centers.map(c => c.id);

    // 2. Update schedules for those centers
    const { data, error } = await supabase
      .from('collection_schedules')
      .update({
        status: 'Received',
        approved_by: managerId || 'Manager',
        approved_at: new Date().toISOString()
      })
      .in('center_id', centerIds)
      .eq('scheduled_date', scheduledDate)
      .neq('status', 'Received')
      .select();

    if (error) throw error;
    res.json({ message: `Staff collections received: ${data.length}`, count: data.length });
  } catch (error) {
    console.error('Staff bulk receive error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Fetch members for a specific schedule's center (PD APPROVED ONLY)
app.get('/api/schedules/:id/members', async (req, res) => {
  const { id } = req.params;
  console.log(`\n--- DEBUG: Fetching members for schedule ${id} ---`);
  try {
    const { data: schedule, error: schError } = await supabase
      .from('collection_schedules')
      .select('center_id')
      .eq('id', id)
      .single();

    if (schError || !schedule) throw schError || new Error('Schedule not found');
    console.log(`DEBUG: Target Center ID: ${schedule.center_id}`);

    // 1. Fetch ALL PD verifications for this center to see what's happening
    const { data: allPDs, error: pdError } = await supabase
      .from('pd_verifications')
      .select('*')
      .eq('center_id', schedule.center_id);

    if (pdError) {
      console.error('PD fetch error:', pdError);
      throw pdError;
    }

    console.log(`DEBUG: Total PD records found for center ${schedule.center_id}: ${allPDs?.length || 0}`);
    if (allPDs && allPDs.length > 0) {
      console.log('DEBUG: PD Data Sample:', JSON.stringify(allPDs.slice(0, 2), null, 2));
    }

    // 2. Filter for approved ones (Case-insensitive)
    const approvedPDs = (allPDs || []).filter(pd => {
      const status = String(pd.status || '').toUpperCase();
      const verified = String(pd.pd_verified).toLowerCase();
      return status === 'APPROVED' || verified === 'true';
    });

    console.log(`DEBUG: Approved PD records count: ${approvedPDs.length}`);

    const approvedMemberIds = approvedPDs.map(pd => Number(pd.member_id)).filter(Boolean);

    if (approvedMemberIds.length === 0) {
      console.log('DEBUG: NO APPROVED MEMBERS FOUND in pd_verifications');
      return res.json([]);
    }

    // 3. Fetch members who are in the approved list
    const { data: members, error: memError } = await supabase
      .from('members')
      .select('id, name, member_no')
      .in('id', approvedMemberIds);

    if (memError) throw memError;
    console.log(`DEBUG: Success! Returning ${members.length} members`);

    res.json(members);
  } catch (error) {
    console.error('CRITICAL FETCH ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch members for a specific center (PD APPROVED ONLY)
app.get('/api/centers/:id/members', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Fetch PD verifications for this center
    const { data: allPDs, error: pdError } = await supabase
      .from('pd_verifications')
      .select('*')
      .eq('center_id', id);

    if (pdError) throw pdError;

    // 2. Filter for approved ones (Case-insensitive)
    const approvedPDs = (allPDs || []).filter(pd => {
      const status = String(pd.status || '').toUpperCase();
      const verified = String(pd.pd_verified).toLowerCase();
      return status === 'APPROVED' || verified === 'true';
    });

    const approvedMemberIds = approvedPDs.map(pd => Number(pd.member_id)).filter(Boolean);
    if (approvedMemberIds.length === 0) return res.json([]);

    // 3. Fetch members
    const { data: members, error: memError } = await supabase
      .from('members')
      .select('id, name, member_no')
      .in('id', approvedMemberIds);

    if (memError) throw memError;
    res.json(members);
  } catch (error) {
    console.error('Fetch center members error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch performance stats for each staff member
app.get('/api/staff/performance', cacheMiddleware(10), async (req, res) => {
  try {
    // 1. Fetch all staff members
    const { data: staffList, error: staffError } = await supabase
      .from('staff')
      .select('staff_id, name, role, mobile, branch');
    if (staffError) throw staffError;

    // 1b. Fetch all applicants to get their images
    const { data: applicants, error: appError } = await supabase
      .from('applicants')
      .select('mobile, image_url')
      .not('image_url', 'is', null);

    // Create a map for quick image lookup
    const imageMap = {};
    if (!appError && applicants) {
      applicants.forEach(a => {
        if (a.mobile) imageMap[a.mobile] = a.image_url;
      });
    }

    // 2. Fetch all centers and their assigned staff
    const { data: centers, error: centerError } = await supabase
      .from('centers')
      .select('id, staff_id');
    if (centerError) throw centerError;

    // 3. Fetch all pending collection schedules (up to today only) using fetchAll helper to get all branches/centers
    const today = new Date().toISOString().split('T')[0];
    const schedules = await fetchAll(() => 
      supabase
        .from('collection_schedules')
        .select('center_id, amount')
        .neq('status', 'Received')
        .lte('scheduled_date', today)
    );

    // 4. Aggregate performance data
    const staffPerformance = staffList
      .filter(s => s.role && s.role.trim().toLowerCase() === 'relationship officer') // ROBUST FILTER: Only Relationship Officers
      .map(staff => {
        // Find IDs of centers managed by this specific staff member
        const managedCenterIds = centers
          .filter(c => c.staff_id === staff.staff_id)
          .map(c => c.id);

        // Calculate total scheduled collection amount for those centers
        const totalCollection = schedules
          .filter(s => managedCenterIds.includes(s.center_id))
          .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

        return {
          ...staff,
          totalCollection,
          centerCount: managedCenterIds.length,
          image_url: imageMap[staff.mobile] || null // Attach image if found in applicants
        };
      });

    res.json(staffPerformance);
  } catch (error) {
    console.error('Staff Performance error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Staff Daily Performance: per-staff today's target, collected, efficiency, center breakdown
app.get('/api/staff-daily-performance', cacheMiddleware(10), async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    // 1. Fetch all staff (RO only)
    const { data: staffList, error: staffError } = await supabase
      .from('staff')
      .select('staff_id, name, branch, role');
    if (staffError) throw staffError;

    // 2. Fetch all centers
    const { data: centers, error: centerError } = await supabase
      .from('centers')
      .select('id, name, staff_id');
    if (centerError) throw centerError;

    // 3. Fetch ALL schedules for the selected date
    const { data: schedules, error: schError } = await supabase
      .from('collection_schedules')
      .select('id, center_id, center_name, member_name, amount, collected_amount, status, scheduled_date, approved_at')
      .eq('scheduled_date', date);
    if (schError) throw schError;

    // 4. Build center → staff map
    const centerToStaff = {};
    centers.forEach(c => { centerToStaff[c.id] = { staff_id: c.staff_id, center_name: c.name }; });

    // 5. Build staff lookup
    const staffMap = {};
    staffList
      .filter(s => s.role && s.role.trim().toLowerCase() === 'relationship officer')
      .forEach(s => {
        staffMap[s.staff_id] = {
          staff_id: s.staff_id,
          staff_name: s.name,
          branch: s.branch || 'N/A',
          target: 0,
          collected: 0,
          centers: {}
        };
      });

    // 6. Aggregate per staff from schedules
    (schedules || []).forEach(s => {
      const centerInfo = centerToStaff[s.center_id];
      if (!centerInfo || !centerInfo.staff_id) return;
      const sid = centerInfo.staff_id;
      if (!staffMap[sid]) return;

      const amt = Number(s.amount) || 0;
      const collAmt = (s.status === 'Paid' || s.status === 'Received')
        ? (Number(s.collected_amount) || amt)
        : 0;

      staffMap[sid].target += amt;
      staffMap[sid].collected += collAmt;

      const cid = s.center_id;
      if (!staffMap[sid].centers[cid]) {
        staffMap[sid].centers[cid] = {
          center_id: cid,
          center_name: centerInfo.center_name || s.center_name || 'Unknown',
          target: 0,
          collected: 0,
          members: []
        };
      }
      staffMap[sid].centers[cid].target += amt;
      staffMap[sid].centers[cid].collected += collAmt;
      staffMap[sid].centers[cid].members.push({
        member_name: s.member_name,
        amount: amt,
        collected: collAmt,
        status: s.status
      });
    });

    // 7. Format result
    const result = Object.values(staffMap)
      .filter(s => s.target > 0) // only staff who have something scheduled today
      .map(s => ({
        staff_id: s.staff_id,
        staff_name: s.staff_name,
        branch: s.branch,
        target: s.target,
        collected: s.collected,
        pending: Math.max(0, s.target - s.collected),
        efficiency: s.target > 0 ? Math.round((s.collected / s.target) * 100) : 0,
        centers: Object.values(s.centers)
      }))
      .sort((a, b) => b.efficiency - a.efficiency);

    res.json({ date, staffPerformance: result });
  } catch (error) {
    console.error('Staff daily performance error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Manager Control Backend running on port ${PORT}`);
});
