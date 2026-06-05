import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, CheckCircle2, Clock, Calendar, RefreshCw,
  User, Menu, DollarSign, Award, Activity, Sparkles, Building2,
  ArrowUpRight, Zap, Target, BarChart3
} from 'lucide-react';
import { API_URL } from '../config';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const userName = localStorage.getItem('name');
  const staffId = localStorage.getItem('staffId');
  const branch = localStorage.getItem('branch');

  if (role !== 'Manager') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030303] text-white flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="bg-[#09090e]/60 backdrop-blur-xl border border-red-500/20 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
          <h2 className="text-2xl font-black text-red-500 mb-2 tracking-tight">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-6">You do not have manager privileges.</p>
          <button onClick={() => navigate('/login')} className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl transition-all">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const [stats, setStats] = useState({
    totalDisbursed: 0, totalApprovedMembers: 0,
    pendingDisbursement: 0, missingAmount: 0
  });
  const [sanctionTracker, setSanctionTracker] = useState([]);
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDateString, setCurrentDateString] = useState('');

  useEffect(() => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDateString(new Date().toLocaleDateString('en-IN', options));
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchSanctionTracker(), fetchStaffPerformance()]);
    setRefreshing(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stats`);
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) { console.error('Stats error:', err); }
  };

  const fetchSanctionTracker = async () => {
    try {
      const res = await fetch(`${API_URL}/api/loans/track-disbursement`);
      const data = await res.json();
      if (res.ok) setSanctionTracker(data);
    } catch (err) { console.error('Tracker error:', err); }
  };

  const fetchStaffPerformance = async () => {
    try {
      const res = await fetch(`${API_URL}/api/staff-daily-performance`);
      const data = await res.json();
      if (res.ok && data.staffPerformance) setStaffPerformance(data.staffPerformance);
    } catch (err) { console.error('Staff performance error:', err); }
  };

  const handleSendToDisbursement = async (centerId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/centers/${centerId}/send-to-disbursement`, { method: 'POST' });
      if (res.ok) { alert('Sent to Disbursement Successfully!'); fetchAllData(); }
    } catch (err) { console.error('Send error:', err); }
    finally { setActionLoading(false); }
  };

  const statCards = [
    {
      label: 'Total Credited (Month)',
      value: `₹${(stats.totalDisbursed || 0).toLocaleString()}`,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      valueCls: 'text-emerald-400',
      borderCls: 'border-emerald-500/20',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.05)]',
      badge: null,
    },
    {
      label: 'Pending Collection',
      value: `₹${(stats.missingAmount || 0).toLocaleString()}`,
      icon: <Clock className="w-5 h-5 text-indigo-400" />,
      iconBg: 'bg-indigo-500/10 border-indigo-500/20',
      valueCls: 'text-indigo-400',
      borderCls: 'border-indigo-500/20',
      glow: 'shadow-[0_0_30px_rgba(99,102,241,0.05)]',
      badge: null,
    },
    {
      label: 'Pending Sanction',
      value: stats.totalApprovedMembers || 0,
      icon: <Users className="w-5 h-5 text-rose-400" />,
      iconBg: 'bg-rose-500/10 border-rose-500/20',
      valueCls: stats.totalApprovedMembers > 0 ? 'text-rose-400' : 'text-white',
      borderCls: stats.totalApprovedMembers > 0 ? 'border-rose-500/30' : 'border-white/[0.05]',
      glow: stats.totalApprovedMembers > 0 ? 'shadow-[0_0_30px_rgba(244,63,94,0.08)]' : '',
      badge: stats.totalApprovedMembers > 0 ? (
        <span className="flex items-center gap-1 text-[9px] text-rose-400 font-black uppercase bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg animate-pulse">
          <Sparkles size={9} /> Action
        </span>
      ) : null,
    },
  ];

  const efficiencyColor = (e) => {
    if (e >= 80) return { bar: 'from-emerald-500 to-teal-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (e >= 50) return { bar: 'from-amber-500 to-orange-500', text: 'text-amber-400', bg: 'bg-amber-500/10' };
    return { bar: 'from-rose-500 to-red-500', text: 'text-rose-400', bg: 'bg-rose-500/10' };
  };

  const statusStyle = (status) => {
    if (status === 'Credited') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status === 'Stored') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (status === 'Pending Sanction') return 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse';
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse';
  };

  const statusDot = (status) => {
    if (status === 'Credited') return 'bg-emerald-400';
    if (status === 'Stored') return 'bg-amber-400';
    if (status === 'Pending Sanction') return 'bg-rose-400';
    return 'bg-blue-400';
  };

  const statusLabel = (status) => {
    if (status === 'Credited') return 'Credited';
    if (status === 'Stored') return 'Stored';
    if (status === 'Pending Sanction') return 'Pending Sanction';
    return 'Sent — Awaiting Credit';
  };

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 flex font-sans selection:bg-indigo-500/30 relative overflow-hidden">

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="absolute top-[35%] right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/4 blur-[100px]" />
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <main className="flex-1 lg:ml-72 p-4 md:p-8 min-w-0 z-10 relative">

        {/* ── Header ── */}
        <header className="flex items-center justify-between gap-4 mb-8 bg-[#09090e]/40 px-4 py-4 md:px-6 md:py-5 rounded-3xl border border-white/[0.05] backdrop-blur-xl shadow-2xl">

          {/* Left: hamburger + avatar + greeting */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden shrink-0 w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 border border-white/5 hover:text-white transition-all"
            >
              <Menu size={18} />
            </button>
            <div className="shrink-0 w-11 h-11 md:w-13 md:h-13 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
              <User className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-0.5 truncate">
                {staffId} • {branch || 'General Branch'}
              </p>
              <h1 className="text-base md:text-xl font-black text-white tracking-tight truncate">
                Hi, {userName || 'Manager'} 👋
              </h1>
            </div>
          </div>

          {/* Right: date + live badge + refresh */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="hidden lg:flex flex-col items-end text-right">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Today</span>
              <span className="text-[11px] text-slate-300 font-semibold">{currentDateString}</span>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              Live
            </span>
            <button
              onClick={fetchAllData}
              className={`p-2.5 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-indigo-400 hover:bg-white/10 active:scale-95 transition-all duration-300 ${refreshing ? 'animate-spin' : ''}`}
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </header>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {statCards.map((s, i) => (
            <div
              key={i}
              className={`bg-[#09090e]/60 border backdrop-blur-xl p-5 md:p-6 rounded-3xl relative overflow-hidden hover:-translate-y-0.5 transition-all duration-300 ${s.borderCls} ${s.glow}`}
            >
              <div className="absolute -right-5 -top-5 w-24 h-24 bg-white/[0.02] rounded-full blur-2xl" />
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl border ${s.iconBg}`}>
                  {s.icon}
                </div>
                {s.badge}
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{s.label}</p>
              <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${s.valueCls}`}>{s.value}</h3>
            </div>
          ))}
        </div>

        {/* ── Main 2-column Layout ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left: Sanction & Disbursement Table (2/3) */}
          <div className="xl:col-span-2 flex flex-col">
            <div className="bg-[#09090e]/50 border border-white/[0.05] backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl flex-1">

              {/* Table header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-5 border-b border-white/[0.05] bg-white/[0.01]">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Activity className="text-indigo-400 w-4 h-4 shrink-0" />
                    Sanction &amp; Disbursement Tracker
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    Live status of center-wise credits
                  </p>
                </div>
                <button
                  onClick={fetchSanctionTracker}
                  className="self-start sm:self-center text-[10px] text-indigo-400 font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all active:scale-95 whitespace-nowrap"
                >
                  Refresh
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                      {['Center', 'Branch', 'Scheme', 'Amount', 'Status', 'Action'].map((h, i) => (
                        <th
                          key={i}
                          className={`px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap ${i === 5 ? 'text-right' : ''}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-xs">
                    {sanctionTracker.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-14 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-600">
                            <BarChart3 size={28} className="opacity-30" />
                            <span className="text-[11px] font-bold uppercase tracking-widest">No active sanctions</span>
                          </div>
                        </td>
                      </tr>
                    ) : sanctionTracker.map((item) => (
                      <tr key={item.centerId} className="group hover:bg-white/[0.02] transition-all duration-150">

                        {/* Center */}
                        <td className="px-5 py-4 align-middle">
                          <p className="font-black text-white text-[12px] uppercase tracking-tight group-hover:text-indigo-300 transition-colors">
                            {item.centerName}
                          </p>
                          <p className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">#{item.centerId}</p>
                        </td>

                        {/* Branch */}
                        <td className="px-5 py-4 align-middle">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 border border-white/10 px-2 py-1 rounded-lg uppercase bg-white/[0.02] whitespace-nowrap">
                            <Building2 size={9} className="text-slate-500 shrink-0" />
                            {item.branch || 'N/A'}
                          </span>
                        </td>

                        {/* Scheme */}
                        <td className="px-5 py-4 align-middle">
                          <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 whitespace-nowrap">
                            {item.scheme}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-4 align-middle font-black text-white text-[12px] whitespace-nowrap">
                          {item.status === 'Pending Sanction'
                            ? <span className="text-[9px] text-slate-500 font-bold italic">Waiting</span>
                            : `₹${(item.totalAmount || 0).toLocaleString()}`
                          }
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 align-middle">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide border whitespace-nowrap ${statusStyle(item.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(item.status)}`} />
                            {statusLabel(item.status)}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 align-middle text-right whitespace-nowrap">
                          {item.status === 'Stored' && (
                            <button
                              onClick={() => handleSendToDisbursement(item.centerId)}
                              disabled={actionLoading}
                              className="text-[9px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black px-3 py-2 rounded-xl uppercase shadow-lg hover:from-indigo-500 hover:to-purple-500 active:scale-95 disabled:opacity-50 transition-all border border-indigo-500/20"
                            >
                              Send →
                            </button>
                          )}
                          {item.status === 'Pending Sanction' && (
                            <button
                              onClick={() => navigate('/loans')}
                              className="text-[9px] bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-black px-3 py-2 rounded-xl uppercase shadow-lg hover:from-rose-400 hover:to-amber-400 active:scale-95 transition-all"
                            >
                              Sanction →
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Staff Performance Panel (1/3) */}
          <div className="xl:col-span-1 flex flex-col">
            <div className="bg-[#09090e]/50 border border-white/[0.05] backdrop-blur-xl rounded-3xl p-6 shadow-2xl flex flex-col flex-1">

              {/* Panel header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Award className="text-purple-400 w-4 h-4 shrink-0" />
                    Staff Performance
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    Today's collection efficiency
                  </p>
                </div>
                {staffPerformance.length > 0 && (
                  <span className="text-[9px] font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-lg uppercase">
                    {staffPerformance.length} Active
                  </span>
                )}
              </div>

              {/* Staff list */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-0.5">
                {staffPerformance.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-slate-600">
                    <Target size={28} className="opacity-20 mb-3" />
                    <p className="text-[11px] font-bold uppercase tracking-widest text-center">
                      No collections scheduled today
                    </p>
                  </div>
                ) : staffPerformance.map((staff, index) => {
                  const ec = efficiencyColor(staff.efficiency);
                  const initials = staff.staff_name.split(' ').map(n => n[0]).slice(0, 2).join('');
                  return (
                    <div
                      key={staff.staff_id}
                      className="p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] rounded-2xl transition-all duration-200 group"
                    >
                      {/* Staff name + efficiency */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] uppercase shrink-0 ${
                            index === 0
                              ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
                              : 'bg-white/5 border border-white/5 text-slate-400'
                          }`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-200 text-[11px] truncate group-hover:text-indigo-300 transition-colors">
                              {staff.staff_name}
                            </p>
                            <p className="text-[9px] text-slate-600 font-bold uppercase">{staff.branch || 'N/A'}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0 ml-2 ${ec.bg} ${ec.text}`}>
                          {staff.efficiency}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full bg-gradient-to-r ${ec.bar} rounded-full transition-all duration-700`}
                          style={{ width: `${Math.min(100, staff.efficiency)}%` }}
                        />
                      </div>

                      {/* Target vs Collected */}
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
                        <span className="text-slate-600">Target: <span className="text-slate-400">₹{(staff.target || 0).toLocaleString()}</span></span>
                        <span className={`${ec.text}`}>₹{(staff.collected || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
