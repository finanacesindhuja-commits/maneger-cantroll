import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaFileInvoiceDollar, FaCalendarAlt, FaUserCircle, FaBars, FaHistory 
} from 'react-icons/fa';
import { API_URL } from '../config';
import Sidebar from '../components/Sidebar';

export default function Loans() {
  const navigate = useNavigate();
  const dateInputRef = useRef(null);
  const staffId = localStorage.getItem('staffId');
  const role = localStorage.getItem('role');
  const userName = localStorage.getItem('name');
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

  const [centers, setCenters] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [formMembers, setFormMembers] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const amountOptions = [
    { value: 10000, label: '₹10,000 (12-Week Plan)' },
    { value: 12000, label: '₹12,000 (16-Week Plan)' },
    { value: 13000, label: '₹13,000' },
    { value: 15000, label: '₹15,000' },
    { value: 20000, label: '₹20,000' }
  ];

  useEffect(() => {
    fetchCenters();
    fetchSchedules();
  }, []);

  const fetchCenters = async () => {
    try {
      const res = await fetch(`${API_URL}/api/centers`);
      const data = await res.json();
      if (res.ok) setCenters(data);
    } catch (err) { console.error('Centers error:', err); }
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`${API_URL}/api/schedules`);
      const data = await res.json();
      if (res.ok) setSchedules(data);
    } catch (err) { console.error('Schedules error:', err); }
  };

  const fetchFormMembers = async (centerId) => {
    if (!centerId) return setFormMembers([]);
    setFormLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/centers/${centerId}/members`);
      const data = await res.json();
      if (res.ok) setFormMembers(data);
    } catch (err) { console.error('Form members error:', err); }
    finally { setFormLoading(false); }
  };

  const handleSanctionCenter = async (e) => {
    e.preventDefault();
    if (!selectedCenter || !selectedAmount) return alert('Please select center and amount');
    const selectedPlan = amountOptions.find(p => p.value === Number(selectedAmount));
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/centers/${selectedCenter}/sanction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amountSanctioned: selectedAmount, 
          schemeName: selectedPlan?.label || 'General Plan',
          staffId 
        })
      });
      if (res.ok) {
        alert('Amount Stored in Supabase successfully!');
        setSelectedCenter('');
        setSelectedAmount('');
        fetchCenters();
      } else {
        const data = await res.json();
        alert('Error: ' + data.error);
      }
    } catch (err) { console.error('Sanction error:', err); }
    finally { setActionLoading(false); }
  };

  const createSchedule = async (e) => {
    e.preventDefault();
    if (!selectedCenter || !selectedDate) return alert('Please select center and date');
    const centerObj = centers.find(c => c.id === Number(selectedCenter));
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/schedules/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centerId: selectedCenter,
          centerName: centerObj?.name || 'Unknown',
          scheduledDate: selectedDate,
          amount: centerObj?.amount || 0
        })
      });
      if (res.ok) {
        alert('Collection Scheduled successfully!');
        setSelectedCenter('');
        setSelectedDate('');
        fetchSchedules();
      }
    } catch (err) { console.error('Schedule error:', err); }
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
              <h1 className="text-md md:text-2xl font-black text-white tracking-tight">Loan Management</h1>
            </div>
          </div>
          <button onClick={() => window.location.reload()} className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-indigo-400 transition-all">
            <FaHistory />
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Slot 1: Amount Approval */}
          <div className="bg-slate-800/40 backdrop-blur border border-white/5 rounded-3xl p-8 shadow-xl min-h-[480px]">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                <FaFileInvoiceDollar size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight uppercase">Amount Approval</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Step 1: Sanction Amount</p>
              </div>
            </div>
            <form onSubmit={handleSanctionCenter} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Select Center</label>
                <select value={selectedCenter} onChange={(e) => { setSelectedCenter(e.target.value); fetchFormMembers(e.target.value); }} className="w-full bg-[#0a0f1c] border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-amber-500 transition-all font-bold appearance-none">
                  <option value="">Select Center...</option>
                  {centers.filter(c => c.canSanction).map(c => <option key={c.id} value={c.id}>{c.name} ({c.branch})</option>)}
                </select>
                {centers.filter(c => c.canSanction).length === 0 && (
                  <p className="text-[10px] text-amber-500/50 font-bold mt-2 text-center animate-pulse">Wait for PD Approval updates...</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Select Amount</label>
                <select value={selectedAmount} onChange={(e) => setSelectedAmount(e.target.value)} className="w-full bg-[#0a0f1c] border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-amber-500 transition-all font-bold appearance-none">
                  <option value="">Pick Amount...</option>
                  {amountOptions.map(amt => <option key={amt.value} value={amt.value}>{amt.label}</option>)}
                </select>
              </div>
              <button type="submit" disabled={actionLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-slate-900 font-black py-4 rounded-2xl shadow-xl shadow-amber-500/20 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50 transition-all">
                {actionLoading ? 'Loading...' : 'Approve Amount'}
              </button>
            </form>
            {selectedCenter && (
              <div className="mt-8 pt-6 border-t border-white/5">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4">Pending Members</h3>
                <div className="grid grid-cols-2 gap-3">
                  {formMembers.map(m => (
                    <div key={m.id} className="bg-white/[0.04] border border-white/10 p-4 rounded-2xl text-center shadow-lg">
                      <span className="text-xs font-black text-white block truncate uppercase tracking-tight">{m.name}</span>
                      <span className="text-[10px] text-amber-500 font-black font-mono">APP ID: {m.member_no || m.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Slot 2: Schedule Date */}
          <div className="bg-slate-800/40 backdrop-blur border border-white/5 rounded-3xl p-8 shadow-xl min-h-[480px]">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                <FaCalendarAlt size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight uppercase">Schedule Date</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Step 2: Set Collection Day</p>
              </div>
            </div>
            <form onSubmit={createSchedule} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Sanctioned Center</label>
                <select value={selectedCenter} onChange={(e) => { setSelectedCenter(e.target.value); fetchFormMembers(e.target.value); }} className="w-full bg-[#0a0f1c] border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-indigo-500 transition-all font-bold appearance-none">
                  <option value="">Select Center...</option>
                  {centers.filter(c => c.canSchedule && !schedules.some(s => s.center_id === Number(c.id))).map(c => <option key={c.id} value={c.id}>{c.name} ({c.branch}) - ₹{c.amount.toLocaleString()}</option>)}
                  {centers.filter(c => c.isWaitingCredit).map(c => <option key={c.id} value="" disabled className="text-slate-600 italic">{c.name} ({c.branch}) - [Waiting Credit]</option>)}
                </select>
                {centers.filter(c => c.canSchedule && !schedules.some(s => s.center_id === Number(c.id))).length === 0 && (
                  <p className="text-[10px] text-indigo-500/50 font-bold mt-2 text-center animate-pulse">Waiting for Disbursement Credit...</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Scheduled Date</label>
                <div className="relative group">
                  <input 
                    ref={dateInputRef}
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    className="w-full bg-[#0a0f1c] border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-indigo-500 transition-all font-bold appearance-none cursor-pointer" 
                  />
                  <div 
                    onClick={() => dateInputRef.current?.showPicker()}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-500 cursor-pointer hover:text-indigo-400 transition-colors"
                  >
                    <FaCalendarAlt size={18} />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={actionLoading} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50 transition-all">
                {actionLoading ? 'Loading...' : 'Set Schedule'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
