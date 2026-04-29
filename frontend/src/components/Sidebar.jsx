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
  const [counts, setCounts] = useState({ loans: 0, collections: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stats`);
        const data = await res.json();
        if (res.ok) {
          setCounts({
            loans: (data.pendingSanctionCount || 0) + (data.pendingScheduleCount || 0),
            collections: data.pendingCollectionCount || 0
          });
        }
      } catch (err) { console.error('Counts fetch error:', err); }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 15000); // Refresh every 15s for better responsiveness
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaChartLine />, path: '/dashboard' },
    { id: 'loans', label: 'Loans', icon: <FaFileInvoiceDollar />, path: '/loans', badge: 'loans', badgeColor: 'bg-amber-500' },
    { id: 'collections', label: 'Collections', icon: <FaCalendarAlt />, path: '/collections', badge: 'collections', badgeColor: 'bg-emerald-500' },
    { id: 'staffs', label: 'Staffs', icon: <FaUsers />, path: '/staffs' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <aside className={`w-72 bg-[#0f172a] border-r border-white/5 flex flex-col fixed h-full z-[70] transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <FaFingerprint className="text-white text-xl" />
            </div>
            <span className="text-white font-black tracking-tighter text-xl uppercase italic">Manager Control</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <FaTimes />
          </button>
        </div>
        <nav className="space-y-2">
          {menuItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => {
                navigate(item.path);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-bold transition-all relative group ${location.pathname === item.path ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-3">
                {item.icon} {item.label}
              </div>
              
              {item.badge && counts[item.badge] > 0 && (
                <span className={`ml-auto ${item.badgeColor} text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-lg ring-4 ring-white/5`}>
                  {counts[item.badge]}
                </span>
              )}

              {/* Active Indicator Dot */}
              {location.pathname === item.path && (
                <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full"></div>
              )}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-8 border-t border-white/5">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-all">
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </aside>
  );
}
