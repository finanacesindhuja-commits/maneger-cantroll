import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, FaCheckCircle, FaHistory, FaUserCircle, FaBars 
} from 'react-icons/fa';
import { API_URL } from '../config';
import Sidebar from '../components/Sidebar';

export default function Collections() {
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

  const [schedules, setSchedules] = useState([]);
  const [monitorDate, setMonitorDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`${API_URL}/api/schedules`);
      const data = await res.json();
      if (res.ok) setSchedules(data);
    } catch (err) { console.error('Schedules error:', err); }
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
              <h1 className="text-md md:text-2xl font-black text-white tracking-tight">Daily Collections</h1>
            </div>
          </div>
          <button onClick={() => window.location.reload()} className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-indigo-400 transition-all">
            <FaHistory />
          </button>
        </header>

        {/* Day-wise Collection Monitor */}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 overflow-hidden relative shadow-2xl">
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

            <div className="lg:col-span-3 bg-white/[0.01] rounded-[1.5rem] md:rounded-[2rem] border border-white/5 overflow-hidden">
              <div className="overflow-x-auto block">
                <table className="w-full text-left border-collapse block md:table">
                  <thead className="hidden md:table-header-group">
                    <tr className="text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-white/5 bg-white/[0.01]">
                      <th className="px-8 py-5">Center Name</th>
                      <th className="px-8 py-5">Branch</th>
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
                            <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Branch</span>
                            <span className="text-[10px] font-bold text-slate-400 border border-white/10 px-2 py-1 rounded-lg">{s.branch || 'N/A'}</span>
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


      </main>
    </div>
  );
}
