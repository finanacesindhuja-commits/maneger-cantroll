import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBars, FaSync, FaCheckCircle, FaUserCircle, FaBuilding,
  FaMoneyBillWave, FaChevronDown, FaChevronUp, FaUsers,
  FaCalendarAlt, FaRupeeSign, FaInbox
} from 'react-icons/fa';
import { API_URL } from '../config';
import Sidebar from '../components/Sidebar';

export default function BranchReceive() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const staffId = localStorage.getItem('staffId');
  const branch = localStorage.getItem('branch');

  if (role !== 'Manager') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060610] text-white flex-col gap-4">
        <h2 className="text-2xl font-bold text-red-500">Access Denied</h2>
        <p className="text-slate-400">You do not have manager privileges.</p>
        <button onClick={() => navigate('/login')} className="px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition">Return to Login</button>
      </div>
    );
  }

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedKey, setExpandedKey] = useState(null);
  const [receiving, setReceiving] = useState({});
  const [receivedKeys, setReceivedKeys] = useState(new Set());
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchGroups = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/schedules/pending-receive`);
      const data = await res.json();
      if (res.ok) setGroups(data || []);
    } catch (err) {
      console.error('Pending receive fetch error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    const interval = setInterval(() => fetchGroups(true), 15000);
    return () => clearInterval(interval);
  }, [fetchGroups]);

  const handleReceive = async (group) => {
    const key = group.key;
    setReceiving(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`${API_URL}/api/schedules/receive-staff-bulk`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: group.staff_id,
          scheduledDate: group.scheduled_date,
          managerId: staffId
        })
      });
      const data = await res.json();
      if (res.ok) {
        setReceivedKeys(prev => new Set([...prev, key]));
        showToast(`✓ ₹${group.total_collected.toLocaleString()} received from ${group.staff_name}!`, 'success');
        setTimeout(() => fetchGroups(true), 1000);
      } else {
        showToast(data.error || 'Receipt failed. Try again.', 'error');
      }
    } catch (err) {
      showToast('Network error. Please retry.', 'error');
    } finally {
      setReceiving(prev => ({ ...prev, [key]: false }));
    }
  };

  const totalPendingAmount = groups.reduce((s, g) => s + g.total_collected, 0);
  const totalPendingCount = groups.reduce((s, g) => s + g.collections_count, 0);
  const uniqueStaff = new Set(groups.map(g => g.staff_id)).size;

  return (
    <div className="min-h-screen bg-[#060610] flex font-sans selection:bg-emerald-500/30 relative overflow-hidden">

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[50%] rounded-full bg-emerald-500/5 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[55%] h-[50%] rounded-full bg-indigo-500/5 blur-[130px]" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[35%] rounded-full bg-teal-500/4 blur-[100px]" />
      </div>

      {/* Sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all animate-bounce-in text-sm font-bold ${
          toast.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-emerald-500/10'
            : 'bg-red-500/15 border-red-500/30 text-red-300 shadow-red-500/10'
        }`}>
          {toast.type === 'success' ? <FaCheckCircle className="text-emerald-400 shrink-0" /> : <span className="text-red-400 shrink-0">✕</span>}
          {toast.msg}
        </div>
      )}

      <main className="flex-1 lg:ml-72 p-4 md:p-8 min-w-0 z-10 relative">

        {/* Header */}
        <header className="flex justify-between items-center mb-8 bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 border border-white/5"
            >
              <FaBars />
            </button>
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 border border-white/10 shrink-0">
              <FaMoneyBillWave className="text-white text-xl md:text-2xl" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em] mb-0.5">{staffId} • {branch || 'General Branch'}</p>
              <h1 className="text-lg md:text-2xl font-black text-white tracking-tight">Branch Cash Receipt</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-emerald-400 font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Live
            </span>
            <button
              onClick={() => fetchGroups()}
              className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-emerald-400 transition-all hover:rotate-180 duration-300"
              title="Refresh"
            >
              <FaSync />
            </button>
          </div>
        </header>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Total Cash Pending */}
          <div className="bg-gradient-to-br from-emerald-600/80 to-teal-700/80 rounded-3xl p-6 shadow-xl shadow-emerald-500/20 border border-emerald-500/20 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
            <p className="text-[10px] text-white/70 font-black uppercase tracking-widest mb-1">Total Cash to Receive</p>
            <h3 className="text-3xl font-black text-white tracking-tighter">₹{totalPendingAmount.toLocaleString()}</h3>
            <p className="text-[9px] text-white/50 uppercase font-bold mt-2">{totalPendingCount} Collections Waiting</p>
          </div>

          {/* Active Staff */}
          <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Staff with Cash</p>
            <h3 className="text-3xl font-black text-indigo-400 tracking-tighter">{uniqueStaff}</h3>
            <p className="text-[9px] text-indigo-500/60 uppercase font-bold mt-2">Awaiting Confirmation</p>
          </div>

          {/* Groups Count */}
          <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Pending Batches</p>
            <h3 className="text-3xl font-black text-amber-400 tracking-tighter">{groups.length}</h3>
            <p className="text-[9px] text-amber-500/60 uppercase font-bold mt-2">Staff × Date Groups</p>
          </div>
        </div>

        {/* Collections List */}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2.5rem] overflow-hidden shadow-2xl">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-2 border-white/5" />
                <div className="absolute inset-0 w-14 h-14 rounded-full border-t-2 border-emerald-500 animate-spin" />
              </div>
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Loading cash receipts...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 gap-4">
              <div className="w-20 h-20 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-center mb-2">
                <FaInbox className="text-slate-700" size={36} />
              </div>
              <p className="text-slate-600 font-black uppercase tracking-widest text-[11px]">No pending cash receipts</p>
              <p className="text-slate-700 text-[10px]">All collections have been received or no staff has submitted cash.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {groups.map((group) => {
                const key = group.key;
                const isExpanded = expandedKey === key;
                const isDone = receivedKeys.has(key);
                const isProcessing = receiving[key];

                return (
                  <div key={key} className={`transition-all ${isDone ? 'opacity-60' : ''}`}>
                    {/* Staff Group Row */}
                    <div
                      className={`flex flex-col md:flex-row md:items-center gap-4 px-6 md:px-8 py-6 cursor-pointer transition-all hover:bg-white/[0.02] ${isExpanded ? 'bg-white/[0.03]' : ''}`}
                      onClick={() => setExpandedKey(isExpanded ? null : key)}
                    >
                      {/* Staff Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                          <FaUserCircle className="text-white text-2xl" />
                        </div>
                        <div>
                          <p className="font-black text-white text-sm uppercase tracking-tight">{group.staff_name}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{group.staff_id}</span>
                            <span className="flex items-center gap-1 text-[9px] text-slate-500 font-bold">
                              <FaBuilding size={8} /> {group.branch}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 md:w-40">
                        <FaCalendarAlt className="text-indigo-400 shrink-0" size={12} />
                        <div>
                          <p className="text-[9px] text-slate-500 font-black uppercase">Collection Date</p>
                          <p className="text-xs font-black text-white">{new Date(group.scheduled_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="text-center">
                          <p className="text-[9px] text-slate-500 font-black uppercase mb-0.5">Collections</p>
                          <span className="flex items-center gap-1.5 text-sm font-black text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                            <FaUsers className="text-indigo-400" size={10} />
                            {group.collections_count}
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-slate-500 font-black uppercase mb-0.5">Cash Amount</p>
                          <p className="text-lg font-black text-emerald-400 tracking-tight">₹{group.total_collected.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center gap-3 ml-0 md:ml-2" onClick={e => e.stopPropagation()}>
                        {isDone ? (
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase px-4 py-2.5 rounded-xl border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                            <FaCheckCircle size={10} /> Received
                          </span>
                        ) : (
                          <button
                            onClick={() => handleReceive(group)}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                          >
                            {isProcessing ? (
                              <>
                                <div className="w-3 h-3 border-t border-white rounded-full animate-spin" />
                                Confirming...
                              </>
                            ) : (
                              <>
                                <FaCheckCircle size={10} />
                                Confirm Receipt
                              </>
                            )}
                          </button>
                        )}
                        <div className="text-slate-600">
                          {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded: Center & Member Breakdown */}
                    {isExpanded && (
                      <div className="bg-black/30 border-t border-white/[0.04] px-6 md:px-10 py-6">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse" />
                          Cash Breakdown — {group.staff_name} • {group.scheduled_date}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {group.centers.map((center) => (
                            <div
                              key={center.center_id}
                              className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/20 transition-all"
                            >
                              {/* Center Header */}
                              <div className="flex items-center justify-between p-4 border-b border-white/5">
                                <div>
                                  <h4 className="text-white font-black text-sm uppercase tracking-tight">{center.center_name}</h4>
                                  <p className="text-[9px] text-slate-500 font-bold mt-0.5">{center.members.length} members</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] text-slate-500 uppercase font-bold">Cash</p>
                                  <p className="text-sm font-black text-emerald-400">₹{center.collected.toLocaleString()}</p>
                                </div>
                              </div>

                              {/* Member List */}
                              <div className="divide-y divide-white/5">
                                {center.members.map((m, idx) => (
                                  <div key={idx} className="flex justify-between items-center px-4 py-2.5">
                                    <div>
                                      <p className="text-xs font-bold text-slate-300 uppercase tracking-tight">{m.member_name}</p>
                                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-emerald-400 bg-emerald-500/10 uppercase">
                                        {m.status}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs font-black text-white">₹{m.collected_amount.toLocaleString()}</p>
                                      {m.collected_amount !== m.amount && (
                                        <p className="text-[9px] text-slate-600 line-through">₹{m.amount.toLocaleString()}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Receive button at bottom of expanded section */}
                        {!isDone && (
                          <div className="mt-6 flex justify-end">
                            <button
                              onClick={() => handleReceive(group)}
                              disabled={receiving[key]}
                              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                            >
                              {receiving[key] ? (
                                <>
                                  <div className="w-4 h-4 border-t border-white rounded-full animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <FaCheckCircle />
                                  Confirm Receipt of ₹{group.total_collected.toLocaleString()}
                                </>
                              )}
                            </button>
                          </div>
                        )}
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
