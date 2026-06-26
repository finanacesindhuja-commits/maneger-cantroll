import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCalendarAlt, FaCheckCircle, FaUserCircle, FaBars,
  FaChevronDown, FaChevronUp, FaSync, FaUsers, FaRupeeSign
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

  const [monitorDate, setMonitorDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedStaff, setExpandedStaff] = useState(null);
  const [expandedCenter, setExpandedCenter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState([]);

  const fetchPerformance = useCallback(async (date, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/staff-daily-performance?date=${date}`);
      const data = await res.json();
      if (res.ok) setPerformance(data.staffPerformance || []);
    } catch (err) {
      console.error('Performance fetch error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformance(monitorDate);
    const interval = setInterval(() => {
      fetchPerformance(monitorDate, true);
    }, 10000);
    return () => clearInterval(interval);
  }, [monitorDate, fetchPerformance]);

  const handleAcceptStaff = async (sid) => {
    try {
      const res = await fetch(`${API_URL}/api/schedules/receive-staff-bulk`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: sid, scheduledDate: monitorDate, managerId: staffId })
      });
      if (res.ok) fetchPerformance(monitorDate);
    } catch (err) { console.error('Staff accept error:', err); }
  };

  const totalTarget = performance.reduce((s, p) => s + p.target, 0);
  const totalCollected = performance.reduce((s, p) => s + p.collected, 0);
  const totalPending = performance.reduce((s, p) => s + p.pending, 0);
  const overallEfficiency = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  const efficiencyColor = (e) => {
    if (e >= 80) return { bar: 'from-emerald-500 to-green-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    if (e >= 50) return { bar: 'from-amber-500 to-yellow-400', text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
    return { bar: 'from-red-500 to-rose-400', text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex font-sans selection:bg-indigo-500/30">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <main className="flex-1 lg:ml-72 p-4 md:p-8 min-w-0">

        {/* Header */}
        <header className="flex justify-between items-center mb-8 bg-white/[0.02] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 border border-white/5 mr-1"
            >
              <FaBars />
            </button>
            <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl border border-white/10 shrink-0">
              <FaCalendarAlt className="text-white text-xl md:text-2xl" />
            </div>
            <div>
              <p className="text-[9px] md:text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-0.5">{staffId} • {branch || 'General'}</p>
              <h1 className="text-lg md:text-2xl font-black text-white tracking-tight">Daily Collection Performance</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              Live
            </span>
            <button
              onClick={() => fetchPerformance(monitorDate)}
              className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-indigo-400 transition-all hover:rotate-180 duration-300"
              title="Refresh Data"
            >
              <FaSync />
            </button>
          </div>
        </header>

        {/* Date Picker + Summary Cards */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center justify-between">
          <div className="flex items-center gap-3 bg-[#0a0f1c] p-2 rounded-2xl border border-white/10 shadow-inner self-start">
            <label className="text-[9px] font-black text-slate-500 uppercase px-3">Collection Date</label>
            <input
              type="date"
              value={monitorDate}
              onChange={(e) => setMonitorDate(e.target.value)}
              className="bg-white/5 border-none rounded-xl px-4 py-2 text-white text-xs font-bold focus:ring-0 cursor-pointer hover:bg-white/10 transition-all font-mono"
            />
          </div>

          <div className="text-right hidden md:block">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{performance.length} Active Staff</p>
            <p className="text-xs text-indigo-400 font-black uppercase tracking-wider mt-0.5">{new Date(monitorDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <p className="text-[10px] text-white/70 font-black uppercase tracking-widest mb-1">Total Target</p>
            <h3 className="text-3xl font-black text-white tracking-tighter">₹{totalTarget.toLocaleString()}</h3>
            <p className="text-[9px] text-white/50 uppercase font-bold mt-2">{performance.length} Staff Today</p>
          </div>

          <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Collected</p>
            <h3 className="text-3xl font-black text-emerald-400 tracking-tighter">₹{totalCollected.toLocaleString()}</h3>
            <p className="text-[9px] text-emerald-500/60 uppercase font-bold mt-2">{overallEfficiency}% Done</p>
          </div>

          <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/10 rounded-full blur-2xl" />
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Pending</p>
            <h3 className="text-3xl font-black text-red-400 tracking-tighter">₹{totalPending.toLocaleString()}</h3>
            <p className="text-[9px] text-red-500/60 uppercase font-bold mt-2">{100 - overallEfficiency}% Remaining</p>
          </div>

          <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Efficiency</p>
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none"
                  stroke={overallEfficiency >= 80 ? '#10b981' : overallEfficiency >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={`${overallEfficiency} ${100 - overallEfficiency}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">{overallEfficiency}%</span>
            </div>
          </div>
        </div>

        {/* Staff Performance List */}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">

          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 border-b border-white/5 bg-white/[0.01]">
            <div className="col-span-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Staff</div>
            <div className="col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Centers</div>
            <div className="col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Target</div>
            <div className="col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Collected</div>
            <div className="col-span-2 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Efficiency</div>
            <div className="col-span-1 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Loading performance data...</p>
            </div>
          ) : performance.length === 0 ? (
            <div className="py-24 text-center">
              <FaCalendarAlt className="mx-auto text-slate-700 mb-4 opacity-20" size={40} />
              <p className="text-slate-600 font-bold uppercase tracking-widest text-[11px]">No collection schedules for this date</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {performance.map((staff) => {
                const col = efficiencyColor(staff.efficiency);
                const isExpanded = expandedStaff === staff.staff_id;
                const allMembers = staff.centers.flatMap(c => c.members);
                const hasPaid = allMembers.some(m => m.status === 'Paid');
                const hasReceived = allMembers.some(m => m.status === 'Received');

                return (
                  <div key={staff.staff_id}>
                    {/* Staff Row */}
                    <div
                      className={`grid grid-cols-2 md:grid-cols-12 gap-4 px-5 md:px-8 py-5 md:py-6 cursor-pointer transition-all hover:bg-white/[0.02] ${isExpanded ? 'bg-white/[0.03]' : ''}`}
                      onClick={() => {
                        setExpandedStaff(isExpanded ? null : staff.staff_id);
                        setExpandedCenter(null);
                      }}
                    >
                      {/* Staff Info */}
                      <div className="col-span-2 md:col-span-3 flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                          <FaUserCircle className="text-white text-xl" />
                        </div>
                        <div>
                          <p className="font-black text-white text-sm uppercase tracking-tight">{staff.staff_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{staff.staff_id}</span>
                            <span className="text-[9px] text-slate-500 font-bold">{staff.branch}</span>
                          </div>
                        </div>
                      </div>

                      {/* Centers count */}
                      <div className="hidden md:flex md:col-span-2 items-center justify-center">
                        <span className="flex items-center gap-2 text-sm font-black text-white bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                          <FaUsers className="text-indigo-400" size={12} />
                          {staff.centers.length}
                        </span>
                      </div>

                      {/* Target */}
                      <div className="hidden md:flex md:col-span-2 items-center justify-end">
                        <p className="text-lg font-black text-white tracking-tight">₹{staff.target.toLocaleString()}</p>
                      </div>

                      {/* Collected */}
                      <div className="hidden md:flex md:col-span-2 items-center justify-end">
                        <p className={`text-lg font-black tracking-tight ${col.text}`}>₹{staff.collected.toLocaleString()}</p>
                      </div>

                      {/* Mobile: Target + Collected */}
                      <div className="col-span-2 md:hidden flex justify-between px-1 mt-1">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Target</p>
                          <p className="text-sm font-black text-white">₹{staff.target.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Collected</p>
                          <p className={`text-sm font-black ${col.text}`}>₹{staff.collected.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Efficiency</p>
                          <p className={`text-sm font-black ${col.text}`}>{staff.efficiency}%</p>
                        </div>
                      </div>

                      {/* Efficiency Bar (Desktop) */}
                      <div className="hidden md:flex md:col-span-2 items-center justify-center">
                        <div className="w-full max-w-[120px]">
                          <div className="flex justify-between mb-1">
                            <span className={`text-[10px] font-black ${col.text}`}>{staff.efficiency}%</span>
                            <span className="text-[9px] text-slate-600 font-bold">₹{staff.pending.toLocaleString()} left</span>
                          </div>
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div
                              className={`h-full bg-gradient-to-r ${col.bar} rounded-full transition-all duration-700`}
                              style={{ width: `${Math.min(staff.efficiency, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="hidden md:flex md:col-span-1 items-center justify-end gap-2">
                        {hasPaid ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAcceptStaff(staff.staff_id); }}
                            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1"
                          >
                            <FaCheckCircle size={9} /> Receive
                          </button>
                        ) : hasReceived ? (
                          <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border text-emerald-400 bg-emerald-500/10 border-emerald-500/20 flex items-center gap-1">
                            <FaCheckCircle size={9} /> Received
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase px-2 py-1 rounded text-slate-500 bg-white/5 border border-white/10">
                            Waiting
                          </span>
                        )}
                        {isExpanded ? <FaChevronUp className="text-slate-500" size={12} /> : <FaChevronDown className="text-slate-500" size={12} />}
                      </div>
                    </div>

                    {/* Expanded: Center Breakdown */}
                    {isExpanded && (
                      <div className="bg-black/30 border-t border-white/5 px-5 md:px-10 py-6">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block" />
                          Center-wise Breakdown — {staff.staff_name}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {staff.centers.map((center) => {
                            const cCol = efficiencyColor(center.target > 0 ? Math.round((center.collected / center.target) * 100) : 0);
                            const cEff = center.target > 0 ? Math.round((center.collected / center.target) * 100) : 0;
                            const isCenterExpanded = expandedCenter === `${staff.staff_id}_${center.center_id}`;

                            return (
                              <div
                                key={center.center_id}
                                className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all"
                              >
                                {/* Center Header */}
                                <div
                                  className="p-4 cursor-pointer"
                                  onClick={() => setExpandedCenter(isCenterExpanded ? null : `${staff.staff_id}_${center.center_id}`)}
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <h4 className="text-white font-black text-sm uppercase tracking-tight">{center.center_name}</h4>
                                      <p className="text-[9px] text-slate-500 font-bold mt-0.5">{center.members.length} members</p>
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${cCol.bg} ${cCol.text}`}>{cEff}%</span>
                                  </div>

                                  <div className="flex justify-between text-xs mb-2">
                                    <div>
                                      <p className="text-[9px] text-slate-500 uppercase font-bold">Target</p>
                                      <p className="font-black text-white">₹{center.target.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[9px] text-slate-500 uppercase font-bold">Collected</p>
                                      <p className={`font-black ${cCol.text}`}>₹{center.collected.toLocaleString()}</p>
                                    </div>
                                  </div>

                                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full bg-gradient-to-r ${cCol.bar} rounded-full transition-all duration-700`}
                                      style={{ width: `${Math.min(cEff, 100)}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Member Breakdown — only collected bills (Paid / Received) */}
                                {isCenterExpanded && (() => {
                                  const collectedMembers = center.members.filter(
                                    m => m.status === 'Paid'
                                  );
                                  const pendingMembers = center.members.filter(
                                    m => m.status === 'Approved' || m.status === 'Pending'
                                  );
                                  return (
                                    <div className="border-t border-white/5">
                                      {/* PAID Section label */}
                                      <div className="px-4 py-2 bg-white/[0.02] flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse" />
                                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                          Collection Control Bills (Paid)
                                        </span>
                                        <span className="ml-auto text-[9px] font-black text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                                          {collectedMembers.length} / {center.members.length} bills
                                        </span>
                                      </div>

                                      {collectedMembers.length === 0 ? (
                                        <div className="flex flex-col items-center py-5 gap-1 opacity-60">
                                          <span className="text-2xl">📋</span>
                                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                            No bills collected yet
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="divide-y divide-white/5 border-b border-white/5">
                                          {collectedMembers.map((m, idx) => (
                                            <div key={idx} className="flex justify-between items-center px-4 py-2.5">
                                              <div>
                                                <p className="text-xs font-bold text-slate-300 uppercase">{m.member_name}</p>
                                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase text-amber-400 bg-amber-500/10">{m.status}</span>
                                              </div>
                                              <div className="text-right">
                                                <p className="text-xs font-black text-white">₹{m.amount.toLocaleString()}</p>
                                                {m.collected > 0 && (
                                                  <p className="text-[9px] text-emerald-400 font-bold">✓ ₹{m.collected.toLocaleString()}</p>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* PENDING Section label */}
                                      {pendingMembers.length > 0 && (
                                        <>
                                          <div className="px-4 py-2 bg-white/[0.02] flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full inline-block" />
                                            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">
                                              Pending Bills (Not Paid)
                                            </span>
                                            <span className="ml-auto text-[9px] font-black text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                                              {pendingMembers.length} bills
                                            </span>
                                          </div>
                                          <div className="divide-y divide-white/5 opacity-70">
                                            {pendingMembers.map((m, idx) => (
                                              <div key={`p-${idx}`} className="flex justify-between items-center px-4 py-2.5 bg-red-500/5">
                                                <div>
                                                  <p className="text-xs font-bold text-slate-300 uppercase">{m.member_name}</p>
                                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase text-slate-400 bg-white/10">Pending</span>
                                                </div>
                                                <div className="text-right">
                                                  <p className="text-xs font-black text-slate-300">₹{m.amount.toLocaleString()}</p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
