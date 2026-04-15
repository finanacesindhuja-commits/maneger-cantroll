import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSignOutAlt, FaChartLine, FaUsers, FaFileInvoiceDollar, FaCalendarAlt, 
  FaCheckCircle, FaClock, FaTimesCircle, FaCheckDouble, FaHistory, 
  FaUserCircle, FaFingerprint, FaBars, FaTimes, FaSearch
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Dashboard() {
  const navigate = useNavigate();
  const dateInputRef = useRef(null);
  const staffId = localStorage.getItem('staffId');
  const role = localStorage.getItem('role');

  if (role !== 'Manager') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] text-white flex-col gap-4">
        <h2 className="text-2xl font-bold text-red-500">Access Denied</h2>
        <p>You do not have manager privileges to view this page.</p>
        <button onClick={() => navigate('/login')} className="px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition">Return to Login</button>
      </div>
    );
  }

  const [userName, setUserName] = useState(localStorage.getItem('name'));
  const [centers, setCenters] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [monitorDate, setMonitorDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedId, setExpandedId] = useState(null);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({ totalDisbursed: 0, totalApprovedMembers: 0, pendingDisbursement: 0 });
  const [sanctionTracker, setSanctionTracker] = useState([]);
  const [formMembers, setFormMembers] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const amountOptions = [
    { value: 10000, label: '₹10,000 (12-Week Plan)' },
    { value: 12000, label: '₹12,000 (16-Week Plan)' },
    { value: 13000, label: '₹13,000' },
    { value: 15000, label: '₹15,000' },
    { value: 20000, label: '₹20,000' }
  ];

  useEffect(() => {
    fetchCenters();
    fetchSchedules();
    fetchStats();
    fetchSanctionTracker();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stats`);
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) { console.error('Stats error:', err); }
  };

  const fetchCenters = async () => {
    try {
      const res = await fetch(`${API_URL}/api/centers`);
      const data = await res.json();
      if (res.ok) setCenters(data);
    } catch (err) { console.error('Centers error:', err); }
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`${API_URL}/api/schedules`);
      const data = await res.json();
      if (res.ok) setSchedules(data);
    } catch (err) { console.error('Schedules error:', err); }
  };

  const fetchSanctionTracker = async () => {
    try {
      const res = await fetch(`${API_URL}/api/loans/track-disbursement`);
      const data = await res.json();
      if (res.ok) setSanctionTracker(data);
    } catch (err) { console.error('Tracker error:', err); }
  };

  const fetchFormMembers = async (centerId) => {
    if (!centerId) return setFormMembers([]);
    setFormLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/centers/${centerId}/members`);
      const data = await res.json();
      if (res.ok) setFormMembers(data);
    } catch (err) { console.error('Form members error:', err); }
    finally { setFormLoading(false); }
  };

  const handleSanctionCenter = async (e) => {
    e.preventDefault();
    if (!selectedCenter || !selectedAmount) return alert('Please select center and amount');
    const selectedPlan = amountOptions.find(p => p.value === Number(selectedAmount));
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/centers/${selectedCenter}/sanction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amountSanctioned: selectedAmount, 
          schemeName: selectedPlan?.label || 'General Plan',
          staffId 
        })
      });
      if (res.ok) {
        alert('Amount Stored in Supabase successfully!');
        setSelectedCenter('');
        setSelectedAmount('');
        fetchCenters();
        fetchStats();
        fetchSanctionTracker();
      } else {
        const data = await res.json();
        alert('Error: ' + data.error);
      }
    } catch (err) { console.error('Sanction error:', err); }
    finally { setActionLoading(false); }
  };

  const handleSendToDisbursement = async (centerId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/centers/${centerId}/send-to-disbursement`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('Sent to Disbursement Successfully!');
        fetchStats();
        fetchSanctionTracker();
      }
    } catch (err) { console.error('Send error:', err); }
    finally { setActionLoading(false); }
  };

  const createSchedule = async (e) => {
    e.preventDefault();
    if (!selectedCenter || !selectedDate) return alert('Please select center and date');
    const centerObj = centers.find(c => c.id === Number(selectedCenter));
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/schedules/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centerId: selectedCenter,
          centerName: centerObj?.name || 'Unknown',
          scheduledDate: selectedDate,
          amount: centerObj?.amount || 0
        })
      });
      if (res.ok) {
        alert('Collection Scheduled successfully!');
        setSelectedCenter('');
        setSelectedDate('');
        fetchSchedules();
      }
    } catch (err) { console.error('Schedule error:', err); }
    finally { setActionLoading(false); }
  };

  const toggleMembers = async (id) => {
    if (expandedId === id) return setExpandedId(null);
    setExpandedId(id);
    try {
      const res = await fetch(`${API_URL}/api/schedules/${id}/members`);
      const data = await res.json();
      if (res.ok) setMembers(data);
    } catch (err) { console.error('Toggle members error:', err); }
  };

  const approveSchedule = async (id) => {
    setActionLoading(true);
    try {
      await fetch(`${API_URL}/api/schedules/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId })
      });
      fetchSchedules(); fetchStats();
    } finally { setActionLoading(false); }
  };

  const rejectSchedule = async (id) => {
    setActionLoading(true);
    try {
      await fetch(`${API_URL}/api/schedules/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId })
      });
      fetchSchedules(); fetchStats();
    } finally { setActionLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex font-sans selection:bg-indigo-500/30">
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* SIDEBAR */}
      <aside className={`w-72 bg-[#0f172a] border-r border-white/5 flex flex-col fixed h-full z-[70] transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <FaFingerprint className="text-white text-xl" />
              </div>
              <span className="text-white font-black tracking-tighter text-xl uppercase italic">Antigravity</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <FaTimes />
            </button>
          </div>
          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <FaChartLine /> },
              { id: 'loans', label: 'Loans', icon: <FaFileInvoiceDollar /> },
              { id: 'collections', label: 'Collections', icon: <FaCalendarAlt /> },
              { id: 'staffs', label: 'Staffs', icon: <FaUsers /> },
              { id: 'reports', label: 'Reports', icon: <FaHistory /> },
            ].map(item => (
              <button key={item.id} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-bold transition-all ${item.id === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-white/5">
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-all">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 lg:ml-72 p-4 md:p-8 min-w-0">
        <header className="flex justify-between items-center mb-10 bg-white/[0.02] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 border border-white/5 mr-1"
            >
              <FaBars />
            </button>
            <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl border border-white/10 shrink-0">
              <FaUserCircle className="text-white text-xl md:text-3xl" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-0.5">Manager Console</p>
              <h1 className="text-md md:text-2xl font-black text-white tracking-tight truncate max-w-[150px] md:max-w-none">Hi, {userName || 'Manager'}</h1>
            </div>
          </div>
          <button onClick={() => window.location.reload()} className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-indigo-400 transition-all">
            <FaHistory />
          </button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-10">
          {[
            { label: 'Total Credited', value: `₹${(stats.totalDisbursed || 0).toLocaleString()}`, icon: <FaCheckCircle />, color: 'from-emerald-500 to-teal-600' },
            { label: 'Pending Credit', value: `₹${(stats.pendingDisbursement || 0).toLocaleString()}`, icon: <FaClock />, color: 'from-blue-400 to-indigo-500' },
            { label: 'Pending Sanction', value: stats.totalApprovedMembers, icon: <FaUsers />, color: 'from-amber-400 to-orange-500' }
          ].map((stat, i) => (
            <div key={i} className="bg-slate-800/40 border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-3xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-5 blur-3xl`}></div>
              <div className="text-slate-400 text-xl md:text-2xl mb-4 text-indigo-400/50">{stat.icon}</div>
              <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* 2 SLOTS WORKFLOW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Slot 1: Amount Approval */}
          <div className="bg-slate-800/40 backdrop-blur border border-white/5 rounded-3xl p-8 shadow-xl min-h-[480px]">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                <FaFileInvoiceDollar size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight uppercase">Amount Approval</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Step 1: Sanction Amount</p>
              </div>
            </div>
            <form onSubmit={handleSanctionCenter} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Select Center</label>
                <select value={selectedCenter} onChange={(e) => { setSelectedCenter(e.target.value); fetchFormMembers(e.target.value); }} className="w-full bg-[#0a0f1c] border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-amber-500 transition-all font-bold appearance-none">
                  <option value="">Select Center...</option>
                  {centers.filter(c => c.canSanction).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {centers.filter(c => c.canSanction).length === 0 && (
                  <p className="text-[10px] text-amber-500/50 font-bold mt-2 text-center animate-pulse">Wait for PD Approval updates...</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Select Amount</label>
                <select value={selectedAmount} onChange={(e) => setSelectedAmount(e.target.value)} className="w-full bg-[#0a0f1c] border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-amber-500 transition-all font-bold appearance-none">
                  <option value="">Pick Amount...</option>
                  {amountOptions.map(amt => <option key={amt.value} value={amt.value}>{amt.label}</option>)}
                </select>
              </div>
              <button type="submit" disabled={actionLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-slate-900 font-black py-4 rounded-2xl shadow-xl shadow-amber-500/20 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50 transition-all">
                {actionLoading ? 'Loading...' : 'Approve Amount'}
              </button>
            </form>
            {selectedCenter && (
              <div className="mt-8 pt-6 border-t border-white/5">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4">Pending Members</h3>
                <div className="grid grid-cols-2 gap-3">
                  {formMembers.map(m => (
                    <div key={m.id} className="bg-white/[0.04] border border-white/10 p-4 rounded-2xl text-center shadow-lg">
                      <span className="text-xs font-black text-white block truncate uppercase tracking-tight">{m.name}</span>
                      <span className="text-[10px] text-amber-500 font-black font-mono">APP ID: {m.member_no || m.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Slot 2: Schedule Date */}
          <div className="bg-slate-800/40 backdrop-blur border border-white/5 rounded-3xl p-8 shadow-xl min-h-[480px]">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                <FaCalendarAlt size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight uppercase">Schedule Date</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Step 2: Set Collection Day</p>
              </div>
            </div>
            <form onSubmit={createSchedule} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Sanctioned Center</label>
                <select value={selectedCenter} onChange={(e) => { setSelectedCenter(e.target.value); fetchFormMembers(e.target.value); }} className="w-full bg-[#0a0f1c] border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-indigo-500 transition-all font-bold appearance-none">
                  <option value="">Select Center...</option>
                  {centers.filter(c => c.canSchedule && !schedules.some(s => s.center_id === Number(c.id))).map(c => <option key={c.id} value={c.id}>{c.name} (₹{c.amount.toLocaleString()})</option>)}
                  {centers.filter(c => c.isWaitingCredit).map(c => <option key={c.id} value="" disabled className="text-slate-600 italic">{c.name} (Waiting for Credit...)</option>)}
                </select>
                {centers.filter(c => c.canSchedule && !schedules.some(s => s.center_id === Number(c.id))).length === 0 && (
                  <p className="text-[10px] text-indigo-500/50 font-bold mt-2 text-center animate-pulse">Waiting for Disbursement Credit...</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Scheduled Date</label>
                <div className="relative group">
                  <input 
                    ref={dateInputRef}
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    className="w-full bg-[#0a0f1c] border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-indigo-500 transition-all font-bold appearance-none cursor-pointer" 
                  />
                  <div 
                    onClick={() => dateInputRef.current?.showPicker()}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-500 cursor-pointer hover:text-indigo-400 transition-colors"
                  >
                    <FaCalendarAlt size={18} />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={actionLoading} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50 transition-all">
                {actionLoading ? 'Loading...' : 'Set Schedule'}
              </button>
            </form>
          </div>
        </div>

        {/* --- Day-wise Collection Monitor --- */}
        <div className="mt-12 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[120px] pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-lg">
                <FaCalendarAlt size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Daily Collection Tracker</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Live Operational Status</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#0a0f1c] p-2 rounded-2xl border border-white/10 shadow-inner">
              <label className="text-[9px] font-black text-slate-500 uppercase px-3">Filter Date</label>
              <input 
                type="date" 
                value={monitorDate} 
                onChange={(e) => setMonitorDate(e.target.value)}
                className="bg-white/5 border-none rounded-xl px-4 py-2 text-white text-xs font-bold focus:ring-0 cursor-pointer hover:bg-white/10 transition-all font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Daily Stat Summary */}
            <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] p-8 shadow-2xl shadow-indigo-500/20 flex flex-col justify-between min-h-[220px] active:scale-[0.98] transition-all">
              <div>
                <p className="text-[10px] text-white/70 font-black uppercase tracking-[0.2em] mb-2">Collection Target</p>
                <h3 className="text-4xl font-black text-white tracking-tighter">
                  ₹{schedules.filter(s => s.scheduled_date === monitorDate).reduce((sum, s) => sum + (Number(s.amount) || 0), 0).toLocaleString()}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-white/90 uppercase bg-white/10 backdrop-blur-sm self-start px-3 py-2 rounded-xl">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                {schedules.filter(s => s.scheduled_date === monitorDate).length} Center Targets
              </div>
            </div>

            {/* Daily Schedule Table */}
            <div className="lg:col-span-3 bg-white/[0.01] rounded-[1.5rem] md:rounded-[2rem] border border-white/5 overflow-hidden">
              <div className="overflow-x-auto block">
                <table className="w-full text-left border-collapse block md:table">
                  <thead className="hidden md:table-header-group">
                    <tr className="text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-white/5 bg-white/[0.01]">
                      <th className="px-8 py-5">Center Name</th>
                      <th className="px-8 py-5">Week Stat</th>
                      <th className="px-8 py-5">Target Amount</th>
                      <th className="px-8 py-5 text-right">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="block md:table-row-group divide-y divide-white/5">
                    {schedules.filter(s => s.scheduled_date === monitorDate).length === 0 ? (
                      <tr className="block md:table-row">
                        <td colSpan="4" className="px-8 py-16 text-center block md:table-cell">
                          <FaCalendarAlt className="mx-auto text-slate-700 mb-2 opacity-20" size={32} />
                          <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">No collection targets for this date</p>
                        </td>
                      </tr>
                    ) : (
                      schedules.filter(s => s.scheduled_date === monitorDate).map((s) => (
                        <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group block md:table-row p-4 md:p-0">
                          <td className="px-4 md:px-8 py-4 md:py-6 font-black text-white block md:table-cell">
                            <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Center Name</span>
                            {s.center_name}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-6 block md:table-cell">
                            <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Status</span>
                            <span className="text-[10px] font-black text-indigo-400 uppercase bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">Active Schedule</span>
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-6 font-black text-white text-lg block md:table-cell">
                            <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Target Amount</span>
                            ₹{(s.amount || 0).toLocaleString()}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-6 text-left md:text-right block md:table-cell border-t border-white/5 md:border-t-0">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-lg shadow-emerald-500/5 hover:scale-105 transition-all w-full md:w-auto justify-center md:justify-end">
                              <FaCheckCircle size={12} /> Ready for RO
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Sanction Tracker Table */}
        <div className="bg-slate-800/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-2xl mt-12">
          <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-tight">Sanction & Disbursement Progress</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Track external credits from disbursement app</p>
            </div>
            <button onClick={fetchSanctionTracker} className="text-[10px] text-indigo-400 font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all text-xs">Refresh</button>
          </div>
          <div className="overflow-x-auto block">
            <table className="w-full text-left border-collapse block md:table">
              <thead className="hidden md:table-header-group">
                <tr className="bg-white/[0.02] text-slate-500 text-[10px] uppercase font-black tracking-widest">
                  <th className="px-8 py-6">Center</th>
                  <th className="px-8 py-6">Scheme</th>
                  <th className="px-8 py-6">Total Amount</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="block md:table-row-group divide-y divide-white/5 text-sm">
                {sanctionTracker.length === 0 ? (
                  <tr className="block md:table-row">
                    <td colSpan="5" className="px-8 py-10 text-center text-slate-500 font-bold block md:table-cell">No active sanctions found.</td>
                  </tr>
                ) : sanctionTracker.map((item) => (
                  <tr key={item.centerId} className="group hover:bg-white/[0.02] transition-colors block md:table-row p-4 md:p-0">
                    <td className="px-5 md:px-8 py-3 md:py-6 block md:table-cell">
                      <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Center</span>
                      <div className="font-black text-white text-lg tracking-tight uppercase">{item.centerName}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">ID: #{item.centerId}</div>
                    </td>
                    <td className="px-5 md:px-8 py-3 md:py-6 block md:table-cell">
                      <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Scheme</span>
                      <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">{item.scheme}</span>
                    </td>
                    <td className="px-5 md:px-8 py-3 md:py-6 font-black text-white block md:table-cell">
                      <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Total Amount</span>
                      ₹{(item.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 md:px-8 py-3 md:py-6 block md:table-cell">
                      <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Status</span>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${item.status === 'Credited' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5' : item.status === 'Stored' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'}`}>
                        {item.status === 'Credited' ? <><FaCheckCircle className="inline mr-1" /> Credited</> : item.status === 'Stored' ? <><FaHistory className="inline mr-1" /> Stored</> : <><FaClock className="inline mr-1" /> Sent (Wait Credit)</>}
                      </span>
                    </td>
                    <td className="px-5 md:px-8 py-5 md:py-6 text-left md:text-right block md:table-cell border-t border-white/5 md:border-t-0 bg-black/10 md:bg-transparent">
                      {item.status === 'Stored' && (
                        <button onClick={() => handleSendToDisbursement(item.centerId)} className="w-full md:w-auto text-[10px] bg-indigo-600 text-white font-black px-4 py-3 md:py-2 rounded-xl uppercase active:scale-95 shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all">
                          Send to Disburse Application
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Table (Collections) */}
        <div className="bg-slate-800/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-2xl mt-12">
          <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <h2 className="text-sm font-black text-white uppercase tracking-tight">Recent Activity (Schedules)</h2>
            <button onClick={fetchSchedules} className="text-[10px] text-indigo-400 font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all text-xs">Refresh</button>
          </div>
          <div className="overflow-x-auto block">
            <table className="w-full text-left border-collapse block md:table">
              <thead className="hidden md:table-header-group">
                <tr className="bg-white/[0.02] text-slate-500 text-[10px] uppercase font-black tracking-widest">
                  <th className="px-8 py-6">Center</th>
                  <th className="px-8 py-6">Scheduled Date</th>
                  <th className="px-8 py-6">Amount</th>
                  <th className="px-8 py-6">Status</th>
                </tr>
              </thead>
              <tbody className="block md:table-row-group divide-y divide-white/5 text-sm">
                {schedules.length === 0 ? (
                  <tr className="block md:table-row">
                    <td colSpan="4" className="px-8 py-10 text-center text-slate-500 font-bold block md:table-cell">No schedules active.</td>
                  </tr>
                ) : schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors block md:table-row p-4 md:p-0">
                    <td className="px-5 md:px-8 py-3 md:py-6 font-black text-white block md:table-cell">
                      <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Center</span>
                      {s.center_name}
                    </td>
                    <td className="px-5 md:px-8 py-3 md:py-6 font-bold text-slate-400 block md:table-cell">
                      <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Date</span>
                      {s.scheduled_date} <span className="text-[10px] opacity-50">({s.scheduled_day})</span>
                    </td>
                    <td className="px-5 md:px-8 py-3 md:py-6 font-black text-white block md:table-cell">
                      <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Amount</span>
                      ₹{(s.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 md:px-8 py-3 md:py-6 block md:table-cell">
                      <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Status</span>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${s.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : s.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
