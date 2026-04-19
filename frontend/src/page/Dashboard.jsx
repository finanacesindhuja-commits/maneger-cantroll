import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaChartLine, FaUsers, FaCheckCircle, FaClock, FaCalendarAlt, FaHistory, FaUserCircle, FaBars
} from 'react-icons/fa';
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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] text-white flex-col gap-4">
        <h2 className="text-2xl font-bold text-red-500">Access Denied</h2>
        <p>You do not have manager privileges to view this page.</p>
        <button onClick={() => navigate('/login')} className="px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition">Return to Login</button>
      </div>
    );
  }

  const [stats, setStats] = useState({ totalDisbursed: 0, totalApprovedMembers: 0, pendingDisbursement: 0 });
  const [sanctionTracker, setSanctionTracker] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
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

  const fetchSanctionTracker = async () => {
    try {
      const res = await fetch(`${API_URL}/api/loans/track-disbursement`);
      const data = await res.json();
      if (res.ok) setSanctionTracker(data);
    } catch (err) { console.error('Tracker error:', err); }
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

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex font-sans selection:bg-indigo-500/30">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

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
              <p className="text-[8px] md:text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-0.5">{staffId} • {branch || 'General'}</p>
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
                  <th className="px-8 py-6">Branch</th>
                  <th className="px-8 py-6">Scheme</th>
                  <th className="px-8 py-6">Total Amount</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="block md:table-row-group divide-y divide-white/5 text-sm">
                {sanctionTracker.length === 0 ? (
                  <tr className="block md:table-row">
                    <td colSpan="6" className="px-8 py-10 text-center text-slate-500 font-bold block md:table-cell">No active sanctions found.</td>
                  </tr>
                ) : sanctionTracker.map((item) => (
                  <tr key={item.centerId} className="group hover:bg-white/[0.02] transition-colors block md:table-row p-4 md:p-0">
                    <td className="px-5 md:px-8 py-3 md:py-6 block md:table-cell">
                      <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Center</span>
                      <div className="font-black text-white text-lg tracking-tight uppercase">{item.centerName}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">ID: #{item.centerId}</div>
                    </td>
                    <td className="px-5 md:px-8 py-3 md:py-6 block md:table-cell">
                      <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Branch</span>
                      <span className="text-[10px] font-bold text-slate-400 border border-white/10 px-2 py-1 rounded-lg uppercase tracking-tighter">{item.branch || 'N/A'}</span>
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
      </main>
    </div>
  );
}
