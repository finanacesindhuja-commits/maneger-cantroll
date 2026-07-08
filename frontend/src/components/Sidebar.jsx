import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaSignOutAlt, FaChartLine, FaUsers, FaFileInvoiceDollar, 
  FaCalendarAlt, FaFingerprint, FaTimes, FaHistory,
  FaMoneyBillWave, FaExclamationCircle
} from 'react-icons/fa';
import { API_URL } from '../config';

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen, refreshKey }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [counts, setCounts] = useState({ 
    loans: 0, schedules: 0, collections: 0, pendingAmount: 0, pendingReceipts: 0 
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stats`);
      const data = await res.json();
      if (res.ok) {
        setCounts({
          loans: data.pendingSanctionCount || 0,
          schedules: data.pendingScheduleCount || 0,
          collections: data.pendingCollectionCount || 0,
          pendingAmount: data.unpaidAmount || 0,
          pendingReceipts: data.pendingReceiptCount || 0
        });
      }
    } catch (err) { 
      console.error('Counts fetch error:', err); 
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever refreshKey changes (triggered by parent after approve)
  useEffect(() => {
    fetchCounts();
  }, [refreshKey]);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <FaChartLine />, 
      path: '/dashboard',
      color: 'indigo'
    },
    { 
      id: 'loans', 
      label: 'Amount Approval', 
      icon: <FaFileInvoiceDollar />, 
      path: '/loans', 
      badge: 'loans', 
      badgeLabel: (v) => `${v} Centers`,
      badgeColor: 'amber',
      urgency: (v) => v > 0
    },
    { 
      id: 'schedule', 
      label: 'Schedule Date', 
      icon: <FaCalendarAlt />, 
      path: '/schedule-date', 
      badge: 'schedules', 
      badgeLabel: (v) => `${v} Pending`,
      badgeColor: 'indigo',
      urgency: (v) => v > 0
    },
    { 
      id: 'collections', 
      label: 'Collections', 
      icon: <FaHistory />, 
      path: '/collections', 
      badge: 'collections', 
      badgeLabel: (v) => `${v} Today`,
      badgeColor: 'emerald',
      urgency: (v) => v > 0
    },
    { 
      id: 'pending-collections', 
      label: 'Pending Bills', 
      icon: <FaMoneyBillWave />, 
      path: '/pending-collections', 
      badge: 'pendingAmount', 
      badgeLabel: (v) => `₹${v.toLocaleString('en-IN')}`,
      badgeColor: 'rose',
      urgency: (v) => v > 0
    },
    { 
      id: 'staffs', 
      label: 'Staffs', 
      icon: <FaUsers />, 
      path: '/staffs',
      color: 'slate'
    },
  ];

  const colorMap = {
    amber:   { active: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   dot: 'bg-amber-400',   badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    indigo:  { active: 'text-indigo-400',  bg: 'bg-indigo-500/15',  border: 'border-indigo-500/30',  dot: 'bg-indigo-400',  badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    emerald: { active: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    rose:    { active: 'text-rose-400',    bg: 'bg-rose-500/15',    border: 'border-rose-500/30',    dot: 'bg-rose-400',    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    slate:   { active: 'text-slate-300',   bg: 'bg-white/[0.05]',   border: 'border-white/10',       dot: 'bg-slate-400',   badge: '' },
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <aside className={`w-72 bg-[#050508]/90 backdrop-blur-2xl border-r border-white/[0.05] flex flex-col fixed h-full z-[70] transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 flex-1 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
              <FaFingerprint className="text-white text-xl" />
            </div>
            <div>
              <span className="text-white font-extrabold tracking-tighter text-sm uppercase block">Manager</span>
              <span className="text-indigo-400 font-black tracking-tighter text-xs uppercase">Control Panel</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all">
            <FaTimes />
          </button>
        </div>

        {/* Live Status Summary */}
        {!loading && (counts.loans > 0 || counts.schedules > 0 || counts.collections > 0) && (
          <div className="mb-6 bg-amber-500/5 border border-amber-500/15 rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Live Alerts</span>
            </div>
            <div className="space-y-1">
              {counts.loans > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold">Amount Approval</span>
                  <span className="text-[10px] font-black text-amber-400">{counts.loans} Centers Ready</span>
                </div>
              )}
              {counts.schedules > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold">Schedule Pending</span>
                  <span className="text-[10px] font-black text-indigo-400">{counts.schedules} Centers</span>
                </div>
              )}
              {counts.collections > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold">Today Collection</span>
                  <span className="text-[10px] font-black text-emerald-400">{counts.collections} Due</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nav Menu */}
        <nav className="space-y-1.5">
          {menuItems.map(item => {
            const isActive = location.pathname === item.path;
            const badgeValue = item.badge ? counts[item.badge] : 0;
            const hasAlert = item.urgency ? item.urgency(badgeValue) : false;
            const color = item.badgeColor || item.color || 'indigo';
            const cls = colorMap[color];

            return (
              <button 
                key={item.id} 
                onClick={() => { navigate(item.path); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all relative border group ${
                  isActive 
                    ? `${cls.bg} text-white ${cls.border} shadow-sm` 
                    : 'text-slate-400 hover:text-slate-200 bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/[0.03]'
                }`}
              >
                {/* Active left bar */}
                {isActive && (
                  <div className={`absolute left-0 w-1 h-7 ${cls.dot} rounded-r-full shadow-lg`}></div>
                )}

                {/* Icon */}
                <span className={`text-base transition-colors ${isActive ? cls.active : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {item.icon}
                </span>

                {/* Label */}
                <span className="flex-1 text-left">{item.label}</span>

                {/* Badge */}
                {item.badge && !loading && badgeValue > 0 && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${cls.badge} ${hasAlert ? 'animate-pulse' : ''}`}>
                    {item.badgeLabel(badgeValue)}
                  </span>
                )}

                {/* Alert dot for urgent items when sidebar closed */}
                {!isActive && hasAlert && !loading && (
                  <span className={`absolute top-2 right-2 w-2 h-2 ${cls.dot} rounded-full ${hasAlert ? 'animate-pulse' : ''} lg:hidden`}></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom - Logout */}
      <div className="p-6 border-t border-white/[0.05]">
        {/* Pending Amount Warning */}
        {counts.pendingAmount > 0 && (
          <div className="mb-4 bg-rose-500/5 border border-rose-500/15 rounded-xl p-3 flex items-center gap-2">
            <FaExclamationCircle className="text-rose-400 text-xs shrink-0" />
            <div>
              <p className="text-[9px] text-rose-400 font-black uppercase tracking-widest">Pending Bills</p>
              <p className="text-[11px] font-black text-rose-300">₹{counts.pendingAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 border border-transparent hover:border-red-500/20 hover:text-red-300 hover:bg-red-500/5 transition-all"
        >
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </aside>
  );
}
