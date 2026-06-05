import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Users, CheckCircle2, Clock, Calendar, RefreshCw, 
  User, Menu, ArrowUpRight, DollarSign, Award, Activity, Sparkles, Building2
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="bg-[#09090e]/60 backdrop-blur-xl border border-red-500/20 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_8px_32px_rgba(239,68,68,0.05)]">
          <h2 className="text-2xl font-black text-red-500 mb-2 tracking-tight">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-6">You do not have manager privileges to view this page.</p>
          <button 
            onClick={() => navigate('/login')} 
            className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl active:scale-[0.98] transition-all shadow-lg shadow-red-950/20"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const [stats, setStats] = useState({ totalDisbursed: 0, totalApprovedMembers: 0, pendingDisbursement: 0, missingAmount: 0 });
  const [sanctionTracker, setSanctionTracker] = useState([]);
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentDateString, setCurrentDateString] = useState('');

  useEffect(() => {
    // Generate readable date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDateString(new Date().toLocaleDateString('en-US', options));

    // Initial fetch
    fetchAllData();

    // Set polling interval
    const interval = setInterval(fetchAllData, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchAllData = () => {
    fetchStats();
    fetchSanctionTracker();
    fetchStaffPerformance();
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
      if (res.ok && data.staffPerformance) {
        setStaffPerformance(data.staffPerformance);
      }
    } catch (err) { console.error('Staff Performance error:', err); }
  };

  const handleSendToDisbursement = async (centerId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/centers/${centerId}/send-to-disbursement`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('Sent to Disbursement Successfully!');
        fetchAllData();
      }
    } catch (err) { console.error('Send error:', err); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 flex font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      {/* Premium background gradient blurs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]"></div>
        <div className="absolute top-[35%] right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/3 blur-[100px]"></div>
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <main className="flex-1 lg:ml-72 p-4 md:p-8 min-w-0 z-10 relative">
        {/* Glassmorphic Header */}
        <header className="flex justify-between items-center mb-8 bg-[#09090e]/40 p-4 md:p-6 rounded-3xl border border-white/[0.05] backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 border border-white/5 mr-1 hover:text-white transition-all"
            >
              <Menu size={20} />
            </button>
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10 shrink-0">
              <User className="text-white w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest mb-0.5">{staffId} • {branch || 'General Branch'}</p>
              <h1 className="text-lg md:text-2xl font-black text-white tracking-tight truncate max-w-[150px] md:max-w-none">Hi, {userName || 'Manager'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-2 text-right">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Current Session Date</span>
              <span className="text-xs text-slate-300 font-medium">{currentDateString}</span>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
              Live Portal
            </span>
            <button 
              onClick={fetchAllData} 
              className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-indigo-400 hover:bg-white/10 active:scale-95 transition-all" 
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        {/* Stats Section with dynamic sparklines and glassmorphic designs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          {[
            { 
              label: 'Total Credited (Month)', 
              value: `₹${(stats.totalDisbursed || 0).toLocaleString()}`, 
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />, 
              color: 'emerald',
              gradient: 'from-emerald-500/10 to-teal-500/5',
              glow: 'shadow-[0_0_30px_rgba(16,185,129,0.05)]',
              sparkline: (
                <svg className="w-24 h-8 text-emerald-400/30" viewBox="0 0 100 30" fill="none">
                  <path d="M0 25 C10 23, 20 28, 30 18 C40 8, 50 15, 60 5 C70 -5, 80 10, 90 2 C100 -5, 110 5, 120 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              ),
              border: 'border-emerald-500/20'
            },
            { 
              label: 'Total Collection Pending', 
              value: `₹${(stats.missingAmount || 0).toLocaleString()}`, 
              icon: <Clock className="w-5 h-5 text-indigo-400" />, 
              color: 'indigo',
              gradient: 'from-indigo-500/10 to-purple-500/5',
              glow: 'shadow-[0_0_30px_rgba(99,102,241,0.05)]',
              sparkline: (
                <svg className="w-24 h-8 text-indigo-400/30" viewBox="0 0 100 30" fill="none">
                  <path d="M0 10 C10 12, 20 5, 30 15 C40 25, 50 8, 60 18 C70 28, 80 12, 90 22 C100 32, 110 15, 120 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              ),
              border: 'border-indigo-500/20'
            },
            { 
              label: 'Pending Sanction (Members)', 
              value: stats.totalApprovedMembers, 
              icon: <Users className="w-5 h-5 text-rose-400" />, 
              color: 'rose',
              gradient: stats.totalApprovedMembers > 0 ? 'from-rose-500/15 to-orange-500/5' : 'from-slate-800/10 to-slate-800/5',
              glow: stats.totalApprovedMembers > 0 ? 'shadow-[0_0_30px_rgba(244,63,94,0.1)]' : 'shadow-none',
              sparkline: stats.totalApprovedMembers > 0 ? (
                <div className="flex items-center gap-1 text-[10px] text-rose-400 font-extrabold uppercase bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md animate-pulse">
                  <Sparkles size={10} /> Action Needed
                </div>
              ) : null,
              border: stats.totalApprovedMembers > 0 ? 'border-rose-500/30 animate-[pulse_2s_infinite]' : 'border-white/5 opacity-70'
            }
          ].map((stat, i) => (
            <div 
              key={i} 
              className={`bg-[#09090e]/60 border backdrop-blur-xl p-6 rounded-3xl relative overflow-hidden group hover:border-white/10 hover:-translate-y-1 transition-all duration-300 ${stat.border} ${stat.glow}`}
            >
              {/* Card ambient light background */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} blur-2xl rounded-full opacity-60`}></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  {stat.icon}
                </div>
                {stat.sparkline}
              </div>
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${stat.color === 'rose' && stats.totalApprovedMembers > 0 ? 'text-rose-400' : 'text-white'}`}>
                {stat.value}
              </h3>
            </div>
          ))}
        </div>

        {/* Dashboard 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Area: Sanction Tracker Table (2 Columns) */}
          <div className="xl:col-span-2">
            <div className="bg-[#09090e]/50 border border-white/[0.05] backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
              <div className="px-6 py-5 border-b border-white/[0.05] bg-white/[0.01] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Activity className="text-indigo-400 w-4 h-4" />
                    Sanction & Disbursement Progress
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Track external credits from disbursement app</p>
                </div>
                <button 
                  onClick={fetchSanctionTracker} 
                  className="w-fit text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest px-4 py-2 rounded-xl border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                >
                  Refresh Tracker
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/[0.05] text-slate-400 text-[10px] uppercase font-extrabold tracking-widest">
                      <th className="px-6 py-4">Center</th>
                      <th className="px-6 py-4">Branch</th>
                      <th className="px-6 py-4">Scheme</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-xs">
                    {sanctionTracker.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-bold">No active sanctions found.</td>
                      </tr>
                    ) : sanctionTracker.map((item) => (
                      <tr key={item.centerId} className="group hover:bg-white/[0.02] transition-all duration-200">
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-white text-sm tracking-tight uppercase group-hover:text-indigo-300 transition-colors">{item.centerName}</div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">ID: #{item.centerId}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 border border-white/10 px-2 py-1 rounded-lg uppercase tracking-tight bg-white/[0.02]">
                            <Building2 size={10} className="text-slate-500" />
                            {item.branch || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[9px] font-extrabold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                            {item.scheme}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-white text-sm">
                          {item.status === 'Pending Sanction' ? (
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic bg-slate-800/10 border border-white/5 px-2 py-0.5 rounded">Waiting Sanction</span>
                          ) : (
                            `₹${(item.totalAmount || 0).toLocaleString()}`
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all ${
                            item.status === 'Credited' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.05)]' 
                              : item.status === 'Stored' 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                : item.status === 'Pending Sanction'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.05)]'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              item.status === 'Credited' ? 'bg-emerald-400' : 
                              item.status === 'Stored' ? 'bg-amber-400' : 
                              item.status === 'Pending Sanction' ? 'bg-rose-400' : 'bg-blue-400'
                            }`}></span>
                            {item.status === 'Credited' ? 'Credited' : 
                             item.status === 'Stored' ? 'Stored' : 
                             item.status === 'Pending Sanction' ? 'Pending Sanction' : 'Sent (Wait Credit)'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.status === 'Stored' && (
                            <button 
                              onClick={() => handleSendToDisbursement(item.centerId)} 
                              disabled={actionLoading}
                              className="text-[9px] bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-extrabold px-3 py-2 rounded-lg uppercase shadow-lg hover:from-indigo-500 hover:to-indigo-600 active:scale-95 disabled:opacity-50 transition-all border border-indigo-500/30"
                            >
                              Send to Disburse
                            </button>
                          )}
                          {item.status === 'Pending Sanction' && (
                            <button 
                              onClick={() => navigate('/loans')} 
                              className="text-[9px] bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-black px-3 py-2 rounded-lg uppercase shadow-lg hover:from-rose-400 hover:to-amber-400 active:scale-95 transition-all"
                            >
                              Sanction
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

          {/* Creative Section: Staff Performance Leaderboard (1 Column) */}
          <div className="xl:col-span-1">
            <div className="bg-[#09090e]/50 border border-white/[0.05] backdrop-blur-xl rounded-3xl p-6 shadow-2xl flex flex-col h-full">
              <div className="mb-6">
                <h2 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Award className="text-purple-400 w-4 h-4" />
                  Staff Daily Performance
                </h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Today's collection target efficiency</p>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto max-h-[350px] pr-1">
                {staffPerformance.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <Activity className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wider">No active collections today</p>
                  </div>
                ) : staffPerformance.map((staff, index) => {
                  // Color codes for efficiency levels
                  let effColor = 'bg-rose-500';
                  let effText = 'text-rose-400';
                  let effBg = 'bg-rose-500/10';
                  
                  if (staff.efficiency >= 90) {
                    effColor = 'bg-gradient-to-r from-emerald-500 to-teal-500';
                    effText = 'text-emerald-400';
                    effBg = 'bg-emerald-500/10';
                  } else if (staff.efficiency >= 50) {
                    effColor = 'bg-gradient-to-r from-amber-500 to-orange-500';
                    effText = 'text-amber-400';
                    effBg = 'bg-amber-500/10';
                  }

                  return (
                    <div 
                      key={staff.staff_id}
                      className="p-3 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03] hover:border-white/[0.06] rounded-2xl transition-all duration-300 group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-[10px] uppercase shadow-inner ${
                            index === 0 ? 'bg-indigo-600/30 border border-indigo-500/30 text-indigo-300' : 'bg-white/5 border border-white/5 text-slate-400'
                          }`}>
                            {staff.staff_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-200 text-xs truncate max-w-[120px] group-hover:text-indigo-400 transition-colors">{staff.staff_name}</h4>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">{staff.branch || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${effBg} ${effText}`}>
                            {staff.efficiency}%
                          </span>
                        </div>
                      </div>

                      {/* Efficiency Progress Bar */}
                      <div className="w-full bg-white/5 rounded-full h-1.5 mb-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${effColor}`} 
                          style={{ width: `${Math.min(100, staff.efficiency)}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                        <span>Target: ₹{(staff.target || 0).toLocaleString()}</span>
                        <span className="text-slate-300">Coll: ₹{(staff.collected || 0).toLocaleString()}</span>
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
