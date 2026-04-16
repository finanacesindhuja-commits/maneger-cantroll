const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
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
    // Using ilike or converting to uppercase for case-insensitivity
    const { data: user, error: dbError } = await supabase
      .from('staff')
      .select('*')
      .ilike('staff_id', staffId)
      .eq('password', password)
      .eq('role', 'Manager')
      .single();

    if (dbError || !user) {
      console.warn('Login failed for:', staffId);

      // Diagnostic: Check if user exists with ANY role
      const { data: anyUser } = await supabase
        .from('staff')
        .select('role, staff_id')
        .ilike('staff_id', staffId)
        .eq('password', password)
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
      name: user.name
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Fetch stats for the dashboard and sidebar indicators
app.get('/api/stats', async (req, res) => {
  try {
    // 1. Total Credited: Sum only for loans CREDITED in the CURRENT MONTH
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: creditedLoans, error: creditError } = await supabase
      .from('loans')
      .select('amount_sanctioned')
      .in('status', ['CREDITED', 'DISBURSED', 'COMPLETED'])
      .gte('credited_at', startOfMonth.toISOString());

    if (creditError) throw creditError;
    const totalCredited = (creditedLoans || []).reduce((sum, l) => sum + (Number(l.amount_sanctioned) || 0), 0);

    // 2. Pending Disbursement: Sum of amount_sanctioned for loans READY but NOT yet CREDITED
    const { data: pendingLoans, error: pendingError } = await supabase
      .from('loans')
      .select('amount_sanctioned')
      .eq('disbursement_app_status', 'READY')
      .neq('status', 'CREDITED')
      .neq('status', 'COMPLETED');

    if (pendingError) throw pendingError;
    const pendingDisbursement = (pendingLoans || []).reduce((sum, l) => sum + (Number(l.amount_sanctioned) || 0), 0);

    // 3. Pending Sanction: Member count (Waiting for Manager)
    const { count: memberCount, error: memberError } = await supabase
      .from('loans')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'APPROVED');

    if (memberError) throw memberError;

    // 4. Sidebar Counts (Center based)
    // Pending Sanction Centers
    const { data: psLoans } = await supabase
      .from('loans')
      .select('center_id')
      .eq('status', 'APPROVED');
    const pendingSanctionCenters = [...new Set(psLoans?.map(l => l.center_id).filter(Boolean))].length;

    // Pending Schedule Centers
    const { data: crLoans } = await supabase
      .from('loans')
      .select('center_id')
      .eq('status', 'CREDITED');
    
    const { data: schData } = await supabase
      .from('collection_schedules')
      .select('center_id');
    const scheduledCenterIds = new Set(schData?.map(s => s.center_id).filter(Boolean));
    
    const pendingScheduleCenters = [...new Set(crLoans?.map(l => l.center_id).filter(Boolean))]
      .filter(id => !scheduledCenterIds.has(id)).length;

    res.json({
      totalDisbursed: totalCredited,
      pendingDisbursement: pendingDisbursement,
      totalApprovedMembers: memberCount || 0,
      pendingSanctionCount: pendingSanctionCenters,
      pendingScheduleCount: pendingScheduleCenters
    });
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
      .select('name, staff_id, role')
      .ilike('staff_id', req.params.staffId)
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: 'Profile not found' });
  }
});

// Fetch centers with active loan activity
app.get('/api/centers', async (req, res) => {
  try {
    // 1. Get unique center IDs and their statuses
    const { data: activeLoans, error: loanError } = await supabase
      .from('loans')
      .select('center_id, status, amount_sanctioned')
      .in('status', ['APPROVED', 'SANCTIONED', 'CREDITED']);

    if (loanError) throw loanError;

    if (!activeLoans || activeLoans.length === 0) {
      return res.json([]);
    }

    const readyCenterIds = [...new Set(activeLoans.map(l => l.center_id))].filter(Boolean);

    // 2. Fetch only those centers
    const { data: centers, error: centerError } = await supabase
      .from('centers')
      .select('*')
      .in('id', readyCenterIds)
      .order('name', { ascending: true });

    if (centerError) throw centerError;

    // 3. Attach stage info to centers for display and filtering
    const enrichedCenters = centers.map(c => {
      const centerLoans = activeLoans.filter(l => l.center_id === c.id);
      
      // A center is "Credited" if it has ANY credited loan (for scheduling)
      const hasCredited = centerLoans.some(l => l.status === 'CREDITED');
      // A center is "Sanctioned" if it has loans waiting for credit
      const hasSanctioned = centerLoans.some(l => l.status === 'SANCTIONED');
      // A center is "Approved" if it has loans waiting for sanction
      const hasApproved = centerLoans.some(l => l.status === 'APPROVED');

      const totalAmount = centerLoans.reduce((sum, l) => sum + (Number(l.amount_sanctioned || 0)), 0);

      return { 
        ...c, 
        amount: totalAmount,
        canSanction: hasApproved, // Strictly PD Approved
        canSchedule: hasCredited,
        isWaitingCredit: hasSanctioned && !hasCredited,
        membersCount: centerLoans.length
      };
    });

    res.json(enrichedCenters);
  } catch (error) {
    console.error('Centers fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// New Endpoint: Track all sanctioned centers and their disbursement status
app.get('/api/loans/track-disbursement', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('center_id, status, amount_sanctioned, member_id, scheme_name, disbursement_app_status')
      .in('status', ['SANCTIONED', 'CREDITED']);

    if (error) throw error;

    // Group by center
    const centerGroups = data.reduce((acc, l) => {
      const cid = l.center_id;
      if (!acc[cid]) {
        acc[cid] = { 
          centerId: cid, 
          totalAmount: 0, 
          status: 'Stored', 
          members: 0, 
          scheme: l.scheme_name,
          dbStatus: l.disbursement_app_status 
        };
      }
      acc[cid].totalAmount += (Number(l.amount_sanctioned) || 0);
      acc[cid].members += 1;
      
      // Determine display status based on database columns
      if (l.status === 'DISBURSED') {
        acc[cid].status = 'Active & Scheduled';
      } else if (l.status === 'CREDITED') {
        acc[cid].status = 'Credited';
      } else if (l.disbursement_app_status === 'READY') {
        acc[cid].status = 'Sent (Waiting Credit)';
      } else {
        acc[cid].status = 'Stored';
      }
      
      return acc;
    }, {});

    // Fetch center names
    const { data: centerNames } = await supabase
      .from('centers')
      .select('id, name')
      .in('id', Object.keys(centerGroups));

    const result = Object.values(centerGroups).map(g => ({
      ...g,
      centerName: centerNames?.find(cn => cn.id === g.centerId)?.name || 'Unknown'
    }));

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
app.get('/api/loans/sanction-queue', async (req, res) => {
  try {
    const { data: loans, error } = await supabase
      .from('loans')
      .select('*, members(member_no)')
      .eq('status', 'APPROVED'); // Matching actual database status

    if (error) throw error;

    const formatted = (loans || []).map(l => ({
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
    // 1. Get all APPROVED loans for this center
    const { data: approvedLoans, error: fetchError } = await supabase
      .from('loans')
      .select('id')
      .eq('center_id', id)
      .eq('status', 'APPROVED');

    if (fetchError) throw fetchError;
    if (!approvedLoans || approvedLoans.length === 0) {
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

// Fetch all collection schedules
app.get('/api/schedules', async (req, res) => {
  try {
    const { data: schedules, error } = await supabase
      .from('collection_schedules')
      .select('*')
      .order('scheduled_date', { ascending: false });

    if (error) throw error;
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
        990, 990, 990, 990, 
        980, 980, 980, 980, 
        970, 970, 970, 970, 
        960, 960, 960, 960
      ]
    }
  };

  try {
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
    const weekdaysArr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const centerMeetingDay = weekdaysArr[centerDate.getDay()];
    
    await supabase
      .from('centers')
      .update({ meeting_day: centerMeetingDay })
      .eq('id', Number(centerId));

    // 4. Generate Weekly Collections PER MEMBER as 'Approved'
    const isPlan = loanPlans[amount]; // Templates based on starting level
    const template = loanPlans["10000"]; // Use 10k as the base multiplier template
    const iterations = isPlan ? isPlan.weeks : 12; // Default to 12 weeks if no specific plan found
    
    const results = [];
    const errors = [];

    // Loop through each member
    for (const loan of (loansToActivate || [])) {
      // Calculate multiplier based on this member's specific sanctioned amount
      const multiplier = (Number(loan.amount_sanctioned) || 10000) / 10000;

      // Generate all weeks for this specific member
      for (let i = 0; i < iterations; i++) {
         const baseDate = new Date(scheduledDate);
         baseDate.setDate(baseDate.getDate() + (i * 7));
         
         let dayIndex = baseDate.getDay();
         if (dayIndex === 0) {
           baseDate.setDate(baseDate.getDate() + 1);
           dayIndex = baseDate.getDay();
         }

         const year = baseDate.getFullYear();
         const month = String(baseDate.getMonth() + 1).padStart(2, '0');
         const day = String(baseDate.getDate()).padStart(2, '0');
         const finalSchDate = `${year}-${month}-${day}`;
         const scheduledDayName = weekdaysArr[dayIndex];
         
         // Calculate member-specific installment for this week
         const currentAmount = template.amounts[i] * multiplier;

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

// Fetch all collection schedules (used for daily monitoring)
app.get('/api/schedules', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('collection_schedules')
      .select('*')
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
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

    const approvedMemberIds = approvedPDs.map(pd => pd.member_id);

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

    const approvedMemberIds = approvedPDs.map(pd => pd.member_id);
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
app.get('/api/staff/performance', async (req, res) => {
  try {
    // 1. Fetch all staff members
    const { data: staffList, error: staffError } = await supabase
      .from('staff')
      .select('staff_id, name, role');
    if (staffError) throw staffError;

    // 2. Fetch all centers and their assigned staff
    const { data: centers, error: centerError } = await supabase
      .from('centers')
      .select('id, staff_id');
    if (centerError) throw centerError;

    // 3. Fetch all collection schedules (only the needed columns for aggregation)
    const { data: schedules, error: schError } = await supabase
      .from('collection_schedules')
      .select('center_id, amount');
    if (schError) throw schError;

    // 4. Aggregate performance data
    const staffPerformance = staffList.map(staff => {
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
        centerCount: managedCenterIds.length
      };
    }).filter(s => s.role !== 'Manager' || s.centerCount > 0); // Hide internal users/managers unless active

    res.json(staffPerformance);
  } catch (error) {
    console.error('Staff Performance error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Manager Control Backend running on port ${PORT}`);
});
