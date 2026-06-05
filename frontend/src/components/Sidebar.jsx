import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaSignOutAlt, FaChartLine, FaUsers, FaFileInvoiceDollar, 
  FaCalendarAlt, FaFingerprint, FaTimes, FaHistory 
} from 'react-icons/fa';
import { API_URL } from '../config';

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [counts, setCounts] = useState({ loans: 0, schedules: 0, collections: 0, pendingAmount: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stats`);
        const data = await res.json();
        if (res.ok) {
          setCounts({
            loans: data.pendingSanctionCount,
            schedules: data.pendingScheduleCount,
            collections: data.pendingCollectionCount || 0,
            pendingAmount: data.missingAmount || 0
          });
        }
      } catch (err) { console.error('Counts fetch error:', err); }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaChartLine />, path: '/dashboard' },
    { id: 'loans', label: 'Amount Approval', icon: <FaFileInvoiceDollar />, path: '/loans', badge: 'loans', badgeColor: 'bg-amber-500' },
    { id: 'schedule', label: 'Schedule Date', icon: <FaCalendarAlt />, path: '/schedule-date', badge: 'schedules', badgeColor: 'bg-indigo-500' },
    { id: 'collections', label: 'Collections', icon: <FaHistory />, path: '/collections', badge: 'collections', badgeColor: 'bg-emerald-500' },
    { id: 'pending-collections', label: 'Pending Bills', icon: <FaFileInvoiceDollar />, path: '/pending-collections', badge: 'pendingAmount', badgeColor: 'bg-rose-500' },
    { id: 'staffs', label: 'Staffs', icon: <FaUsers />, path: '/staffs' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <aside className={`w-72 bg-[#050508]/85 backdrop-blur-2xl border-r border-white/[0.05] flex flex-col fixed h-full z-[70] transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
              <FaFingerprint className="text-white text-xl" />
            </div>
            <span className="text-white font-extrabold tracking-tighter text-lg uppercase bg-clip-text bg-gradient-to-r from-white to-slate-400">Manager Control</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all">
            <FaTimes />
          </button>
        </div>
        <nav className="space-y-2">
          {menuItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button 
                key={item.id} 
                onClick={() => {
                  navigate(item.path);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all relative border ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/5 text-white border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.08)]' 
                    : 'text-slate-400 hover:text-slate-200 bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                
                {item.badge && counts[item.badge] > 0 && (
                  <span className={`ml-auto text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg border ${
                    item.id === 'pending-collections' 
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.05)]' 
                      : `${item.badgeColor} text-slate-955 animate-pulse border-transparent`
                  }`}>
                    {item.id === 'pending-collections' 
                      ? `₹${counts[item.badge].toLocaleString()}` 
                      : counts[item.badge]}
                  </span>
                )}

                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 w-1 h-7 bg-indigo-500 rounded-r-full shadow-[0_0_10px_#6366f1]"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto p-8 border-t border-white/[0.05]">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-red-400 border border-transparent hover:border-red-500/20 hover:text-red-300 hover:bg-red-500/5 transition-all">
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </aside>
  );
}
