import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaFileInvoiceDollar, FaUserCircle, FaBars, FaHistory, FaCheckCircle,
  FaSpinner, FaExclamationTriangle, FaUsers, FaSync
} from 'react-icons/fa';
import { API_URL } from '../config';
import Sidebar from '../components/Sidebar';

export default function Loans() {
  const navigate = useNavigate();
  const staffId = localStorage.getItem('staffId');
  const role = localStorage.getItem('role');
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
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [stpAmount, setStpAmount] = useState('150');
  const [actionLoading, setActionLoading] = useState(false);
  const [formMembers, setFormMembers] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

  const amountOptions = [
    { id: '10000_12w', value: 10000, label: '₹10,000 (12-Week Plan)' },
    {
      id: '10000_saving',
      value: 10000,
      label: '₹10,000 (Saving)',
      isSaving: true,
      weeks: 15,
      weeklyAmount: 990,
      emiAmount: 890,
      savingPerWeek: 100,
      defaultStp: 150
    },
    { id: '11000_15w', value: 11000, label: '₹11,000 (15-Week Plan)' },
    { id: '12000_16w', value: 12000, label: '₹12,000 (16-Week Plan)' },
    { id: '13000_18w', value: 13000, label: '₹13,000 (18-Week Plan)' },
    { id: '15000_22w', value: 15000, label: '₹15,000 (22-Week Plan)' },
    { id: '20000', value: 20000, label: '₹20,000' }
  ];

  const selectedPlan = amountOptions.find(p => p.id === selectedPlanId) || null;

  useEffect(() => {
    fetchCenters();
    const interval = setInterval(fetchCenters, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCenter) fetchFormMembers(selectedCenter);
    else setFormMembers([]);
  }, [selectedCenter]);

  const fetchCenters = async () => {
    try {
      setError('');
      const res = await fetch(`${API_URL}/api/centers`);
      const data = await res.json();
      if (res.ok) {
        setCenters(Array.isArray(data) ? data : []);
        setLastRefresh(new Date());
      } else {
        setError('Failed to load centers: ' + (data.error || 'Server error'));
      }
    } catch (err) {
      setError('Unable to connect to server. Please check if backend is running.');
      console.error('Centers error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormMembers = async (centerId) => {
    if (!centerId) return setFormMembers([]);
    setFormLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/centers/${centerId}/members`);
      const data = await res.json();
      if (res.ok) setFormMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Form members error:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSanctionCenter = async (e) => {
    e.preventDefault();
    if (!selectedCenter || !selectedPlan) return alert('Please select a Center and Amount.');
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/centers/${selectedCenter}/sanction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amountSanctioned: selectedPlan.value, 
          schemeName: selectedPlan.label || 'General Plan',
          isSavingPlan: Boolean(selectedPlan.isSaving),
          stpAmount: selectedPlan.isSaving ? Number(stpAmount || 0) : 0,
          savingPerWeek: selectedPlan.isSaving ? selectedPlan.savingPerWeek : 0,
          staffId 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`✅ ${selectedPlan.label} approved successfully!`);
        setTimeout(() => setSuccessMsg(''), 5000);
        setSelectedCenter('');
        setSelectedPlanId('');
        setStpAmount('150');
        setFormMembers([]);
        fetchCenters();
        // 500ms delay: backend cache flush + Supabase write propagate ஆகட்டும்
        setTimeout(() => setSidebarRefreshKey(k => k + 1), 500);
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Sanction error:', err);
      alert('Server error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const sanctionCenters = centers.filter(c => c.canSanction);
  const pdCenters = centers.filter(c => c.stage === 'PD');
  const allCenters = centers.length;

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex font-sans selection:bg-indigo-500/30">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} refreshKey={sidebarRefreshKey} />

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
            <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl border border-white/10 shrink-0">
              <FaFileInvoiceDollar className="text-white text-xl md:text-3xl" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] text-amber-400 font-black uppercase tracking-[0.2em] mb-0.5">{staffId} • {branch || 'General'}</p>
              <h1 className="text-md md:text-2xl font-black text-white tracking-tight">Amount Approval</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="hidden md:block text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                {lastRefresh.toLocaleTimeString('en-IN')}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              Live
            </span>
            <button 
              onClick={fetchCenters} 
              className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-amber-400 transition-all hover:bg-amber-500/10" 
              title="Refresh"
            >
              <FaSync />
            </button>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-white">{allCenters}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Total Centers</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-amber-400">{sanctionCenters.length}</p>
            <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest mt-1">Ready to Approve</p>
          </div>
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-indigo-400">{pdCenters.length}</p>
            <p className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest mt-1">In PD Stage</p>
          </div>
        </div>

        <div className="max-w-3xl">
          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
              <FaExclamationTriangle className="text-red-400 shrink-0" />
              <p className="text-sm font-bold text-red-400">{error}</p>
              <button onClick={fetchCenters} className="ml-auto text-[10px] bg-red-500/20 px-3 py-1 rounded-lg text-red-400 font-bold uppercase">Retry</button>
            </div>
          )}

          {/* Success */}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 animate-[pulse_2s_ease-in-out_infinite]">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                <FaCheckCircle />
              </div>
              <p className="text-sm font-bold text-emerald-400">{successMsg}</p>
            </div>
          )}

          {/* Amount Approval Form */}
          <div className="bg-slate-800/40 backdrop-blur border border-white/5 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                <FaFileInvoiceDollar size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight uppercase">Amount Approval</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Only PD Approved Centers are shown</p>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <FaSpinner className="text-amber-400 text-3xl animate-spin" />
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Centers Loading...</p>
              </div>
            ) : (
              <form onSubmit={handleSanctionCenter} className="space-y-6">
                {/* Center Select */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Center Select 
                    </label>
                    <span className="text-[9px] text-amber-500 font-bold uppercase">
                      {sanctionCenters.length} Available
                    </span>
                  </div>
                  
                  <select 
                    value={selectedCenter} 
                    onChange={(e) => setSelectedCenter(e.target.value)} 
                    className="w-full bg-[#0a0f1c] border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-amber-500 transition-all font-bold appearance-none"
                  >
                    <option value="">-- Center Select --</option>
                    {sanctionCenters.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.branch}) — {c.membersCount} Members
                      </option>
                    ))}
                  </select>

                  {/* Status info when no centers available */}
                  {sanctionCenters.length === 0 && !loading && (
                    <div className="mt-3 bg-[#0a0f1c] border border-white/5 rounded-2xl p-5 space-y-3">
                      <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest text-center animate-pulse">
                        ⏳ No PD Approved Centers Available
                      </p>
                      {pdCenters.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center">
                            {pdCenters.length} Centers currently in PD Verification:
                          </p>
                          {pdCenters.map(c => (
                            <div key={c.id} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2">
                              <span className="text-[10px] font-black text-white uppercase">{c.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-indigo-400 font-bold">{c.membersCount} members</span>
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${c.isPDComplete ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-500'}`}>
                                  {c.isPDComplete ? '✓ PD Done' : 'PD Pending'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {allCenters === 0 && (
                        <p className="text-[9px] text-slate-700 font-bold uppercase tracking-widest text-center italic">
                          No active centers available
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Members Preview */}
                {selectedCenter && (
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FaUsers className="text-amber-500 text-xs" />
                      <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Center Members</h3>
                    </div>
                    {formLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <FaSpinner className="text-amber-400 animate-spin" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {formMembers.map(m => (
                          <div key={m.id} className="bg-white/[0.04] border border-white/10 p-3 rounded-xl text-center">
                            <span className="text-xs font-black text-white block truncate uppercase tracking-tight">{m.name}</span>
                            <span className="text-[10px] text-amber-500 font-black font-mono">ID: {m.member_no || m.id}</span>
                          </div>
                        ))}
                        {formMembers.length === 0 && (
                          <p className="col-span-2 text-center text-[10px] text-slate-600 font-bold uppercase py-2">No members available</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Amount Select */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Amount Select</label>
                  <select 
                    value={selectedPlanId} 
                    onChange={(e) => {
                      const pid = e.target.value;
                      setSelectedPlanId(pid);
                      const plan = amountOptions.find(p => p.id === pid);
                      if (plan?.isSaving) {
                        setStpAmount(String(plan.defaultStp ?? 150));
                      }
                    }} 
                    className="w-full bg-[#0a0f1c] border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-amber-500 transition-all font-bold appearance-none"
                  >
                    <option value="">-- Amount Select--</option>
                    {amountOptions.map(amt => (
                      <option key={amt.id} value={amt.id}>{amt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Saving & STP Breakdown Card */}
                {selectedPlan?.isSaving && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                        Saving Plan Breakdown (15-Week Standard)
                      </span>
                      <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full">
                        ₹990 / Week × 15
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                      <div className="bg-[#0a0f1c]/70 border border-white/5 rounded-xl p-3">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Weekly EMI</p>
                        <p className="text-base font-black text-white mt-0.5">₹890</p>
                        <p className="text-[9px] text-slate-500">15 Wks = ₹13,350</p>
                      </div>
                      <div className="bg-[#0a0f1c]/70 border border-white/5 rounded-xl p-3">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Weekly Saving</p>
                        <p className="text-base font-black text-emerald-400 mt-0.5">₹100</p>
                        <p className="text-[9px] text-slate-500">15 Wks = ₹1,500</p>
                      </div>
                      <div className="col-span-2 sm:col-span-1 bg-[#0a0f1c]/70 border border-white/5 rounded-xl p-3">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Loan Interest + STP</p>
                        <p className="text-base font-black text-amber-400 mt-0.5">
                          ₹{(3350 + (Number(stpAmount) || 0)).toLocaleString('en-IN')}
                        </p>
                        <p className="text-[9px] text-slate-500">₹3,350 + ₹{Number(stpAmount) || 0} STP</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">
                        STP Amount Per Member (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={stpAmount}
                        onChange={(e) => setStpAmount(e.target.value)}
                        className="w-full bg-[#0a0f1c] border border-emerald-500/30 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="150"
                      />
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={actionLoading || !selectedCenter || !selectedPlanId || sanctionCenters.length === 0} 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-slate-900 font-black py-4 rounded-2xl shadow-xl shadow-amber-500/20 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <><FaSpinner className="animate-spin" /> Processing...</>
                  ) : (
                    <><FaCheckCircle /> Approve Amount</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
