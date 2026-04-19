import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, FaUserTie, FaCoins, FaMapMarkedAlt, 
  FaHistory, FaUserCircle, FaBars 
} from 'react-icons/fa';
import { API_URL } from '../config';
import Sidebar from '../components/Sidebar';

export default function Staffs() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const userName = localStorage.getItem('name');
  const loggedInStaffId = localStorage.getItem('staffId'); // Using a different name to avoid conflict with 'staff' in map
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

  useEffect(() => {
    fetchStaffPerformance();
  }, []);

  const fetchStaffPerformance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/staff/performance`);
      const data = await res.json();
      if (res.ok) {
        // Frontend Filter: Ensure only Relationship Officers are shown
        const filteredData = (data || []).filter(s => 
          s.role && s.role.trim().toLowerCase() === 'relationship officer'
        );
        setStaffPerformance(filteredData);
      }
    } catch (err) {
      console.error('Staff fetch error:', err);
    } finally {
      setLoading(false);
    }
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
              <FaUsers className="text-white text-xl md:text-3xl" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-0.5">{loggedInStaffId} • {branch || 'General'}</p>
              <h1 className="text-md md:text-2xl font-black text-white tracking-tight">Staff Management</h1>
            </div>
          </div>
          <button onClick={fetchStaffPerformance} className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-indigo-400 transition-all">
            <FaHistory />
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Staff Data...</p>
            </div>
          ) : staffPerformance.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white/[0.02] rounded-[2rem] border border-white/5">
              <FaUserCircle className="mx-auto text-slate-700 mb-4 opacity-20" size={48} />
              <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">No staff members found.</p>
            </div>
          ) : (
            staffPerformance.map((staff) => (
              <div key={staff.staff_id} className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] pointer-events-none group-hover:bg-indigo-500/10 transition-all"></div>
                
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 group-hover:scale-105 transition-all shadow-lg flex-shrink-0 bg-slate-900 flex items-center justify-center">
                    {staff.image_url ? (
                      <img 
                        src={staff.image_url} 
                        alt={staff.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src = ''; /* Fallback logic handled by parent if needed */ }}
                      />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-indigo-400">
                        <FaUserTie size={28} />
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20 uppercase tracking-widest">
                      {staff.role}
                    </span>
                    <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-tighter">ID: {staff.staff_id} • {staff.branch || 'N/A'}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-black text-white tracking-tight mb-1">{staff.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    <FaMapMarkedAlt className="text-indigo-500/50" />
                    Managing {staff.centerCount} Centers
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-[#0a0f1c] p-4 rounded-2xl border border-white/5 shadow-inner">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Total Collection Responsibility</p>
                    <div className="flex items-center gap-2">
                      <FaCoins className="text-amber-500" />
                      <span className="text-2xl font-black text-white tracking-tighter">
                        ₹{(staff.totalCollection || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-600">Performance Status</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                    Active
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
