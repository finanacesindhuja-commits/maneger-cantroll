import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PiggyBank, Users, RefreshCw, Menu, Search, Building2,
  Phone, ArrowDownCircle, ArrowUpCircle, ShieldCheck, AlertTriangle, X, CheckCircle2
} from 'lucide-react';
import { API_URL } from '../config';
import Sidebar from '../components/Sidebar';

export default function Savings() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const staffId = localStorage.getItem('staffId');
  const branch = localStorage.getItem('branch');

  if (role !== 'Manager') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030303] text-white flex-col gap-4">
        <h2 className="text-2xl font-black text-red-500">Access Denied</h2>
        <p className="text-slate-400 text-sm">You do not have manager privileges to view this page.</p>
        <button onClick={() => navigate('/login')} className="px-6 py-2 bg-indigo-600 rounded-xl font-bold">
          Return to Login
        </button>
      </div>
    );
  }

  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState({
    totalMembers: 0,
    totalStp: 0,
    totalWeeklySaving: 0,
    totalWithdrawn: 0,
    netBalance: 0
  });
  const [sqlReady, setSqlReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');

  // Modal state for manual withdrawal / deposit
  const [activeMember, setActiveMember] = useState(null);
  const [txType, setTxType] = useState('WITHDRAWAL');
  const [txAmount, setTxAmount] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [txLoading, setTxLoading] = useState(false);

  const fetchSavings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/savings`);
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members || []);
        setSummary(data.summary || {
          totalMembers: 0,
          totalStp: 0,
          totalWeeklySaving: 0,
          totalWithdrawn: 0,
          netBalance: 0
        });
        setSqlReady(data.sqlReady !== false);
      }
    } catch (err) {
      console.error('Savings fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavings();
  }, []);

  const branchOptions = useMemo(() => {
    const set = new Set(members.map(m => m.branch).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return members.filter(m => {
      const matchesSearch =
        (m.member_name || '').toLowerCase().includes(q) ||
        (m.center_name || '').toLowerCase().includes(q) ||
        (m.mobile_no || '').toString().includes(q) ||
        (m.loan_id || '').toString().includes(q);
      const matchesBranch = selectedBranch === 'All' || m.branch === selectedBranch;
      return matchesSearch && matchesBranch;
    });
  }, [members, searchQuery, selectedBranch]);

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!activeMember || !txAmount || Number(txAmount) <= 0) {
      return alert('Please enter a valid positive amount.');
    }
    setTxLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/savings/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: activeMember.loan_id,
          memberId: activeMember.member_id,
          memberName: activeMember.member_name,
          centerId: activeMember.center_id,
          centerName: activeMember.center_name,
          transactionType: txType,
          amount: Number(txAmount),
          notes: txNotes,
          staffId
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveMember(null);
        setTxAmount('');
        setTxNotes('');
        fetchSavings();
      } else {
        alert('Error: ' + (data.error || 'Failed to record transaction'));
      }
    } catch (err) {
      console.error('Transaction error:', err);
      alert('Server error. Please try again.');
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 flex font-sans selection:bg-emerald-500/30 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]"></div>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <main className="flex-1 lg:ml-72 p-4 md:p-8 min-w-0 z-10 relative">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 bg-[#09090e]/40 p-4 md:p-6 rounded-3xl border border-white/[0.05] backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 border border-white/5 mr-1 hover:text-white transition-all"
            >
              <Menu size={20} />
            </button>
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-white/10 shrink-0">
              <PiggyBank className="text-white w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest mb-0.5">
                {staffId} • {branch || 'General Branch'}
              </p>
              <h1 className="text-lg md:text-2xl font-black text-white tracking-tight">Savings & STP Ledger</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
              ₹10,000 (Saving) • 15 Wks @ ₹990
            </span>
            <button
              onClick={fetchSavings}
              className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-emerald-400 hover:bg-white/10 active:scale-95 transition-all"
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        {!sqlReady && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="text-amber-400 shrink-0" size={20} />
            <p className="text-xs font-bold text-amber-200">
              Database ledger table <code className="bg-black/40 px-1.5 py-0.5 rounded">member_savings</code> is not created yet. Run <code className="bg-black/40 px-1.5 py-0.5 rounded">add_saving_plan_setup.sql</code> in Supabase SQL Editor for full ledger tracking.
            </p>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-[#09090e]/60 border border-white/[0.05] backdrop-blur-xl p-6 rounded-3xl">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 w-fit mb-4">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Saving Plan Members</p>
            <h3 className="text-2xl font-black text-white">{summary.totalMembers}</h3>
          </div>

          <div className="bg-[#09090e]/60 border border-amber-500/20 backdrop-blur-xl p-6 rounded-3xl">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 w-fit mb-4">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Total STP Collected</p>
            <h3 className="text-2xl font-black text-amber-400">₹{summary.totalStp.toLocaleString('en-IN')}</h3>
          </div>

          <div className="bg-[#09090e]/60 border border-emerald-500/20 backdrop-blur-xl p-6 rounded-3xl">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 w-fit mb-4">
              <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Weekly Savings Collected</p>
            <h3 className="text-2xl font-black text-emerald-400">₹{summary.totalWeeklySaving.toLocaleString('en-IN')}</h3>
          </div>

          <div className="bg-[#09090e]/60 border border-teal-500/20 backdrop-blur-xl p-6 rounded-3xl">
            <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20 w-fit mb-4">
              <PiggyBank className="w-5 h-5 text-teal-400" />
            </div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Net Saving Balance</p>
            <h3 className="text-2xl font-black text-white">₹{summary.netBalance.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#09090e]/50 border border-white/[0.05] backdrop-blur-xl rounded-3xl p-5 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center shadow-xl">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search member, mobile, center..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/[0.08] rounded-2xl text-slate-200 text-xs font-bold focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-white/[0.08] rounded-2xl px-3 py-1.5 w-full md:w-auto">
            <Building2 className="text-slate-500 w-3.5 h-3.5" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Branch:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-200 focus:ring-0 cursor-pointer p-0"
            >
              {branchOptions.map(br => (
                <option key={br} value={br} className="bg-[#0c0c14] text-slate-200">{br}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-[#09090e]/50 border border-white/[0.05] backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.05] text-slate-400 text-[10px] uppercase font-extrabold tracking-widest">
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Center & Branch</th>
                  <th className="px-6 py-4">Plan & Status</th>
                  <th className="px-6 py-4">STP</th>
                  <th className="px-6 py-4">Weekly Saving Progress</th>
                  <th className="px-6 py-4 text-right">Saving Balance</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center text-slate-500 font-bold">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="animate-spin text-emerald-500 w-8 h-8" />
                        <span>Loading savings ledger...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center text-slate-500 font-bold">
                      <span className="uppercase text-[10px] tracking-wider">No ₹10,000 (Saving) members found yet.</span>
                    </td>
                  </tr>
                ) : filteredMembers.map((m) => {
                  const pct = m.total_weeks > 0 ? Math.min(100, Math.round((m.paid_weeks / m.total_weeks) * 100)) : 0;
                  return (
                    <tr key={m.loan_id} className="hover:bg-white/[0.02] transition-all">
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-white text-sm uppercase">{m.member_name}</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Loan #{m.loan_id}</div>
                        {m.mobile_no && (
                          <a href={`tel:${m.mobile_no}`} className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                            <Phone size={9} /> {m.mobile_no}
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-300 uppercase">{m.center_name}</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">{m.branch}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-emerald-300 text-xs">{m.scheme_name}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">₹890 EMI + ₹{m.saving_per_week} Saving = ₹{890 + m.saving_per_week}/wk</div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase bg-white/5 border border-white/10 text-slate-300">
                          {m.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-amber-400">
                        ₹{m.stp_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span className="text-slate-300">{m.paid_weeks} / {m.total_weeks} Weeks</span>
                          <span className="text-emerald-400">₹{m.weekly_saving_collected.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-36 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-white text-sm">
                        ₹{m.saving_balance.toLocaleString('en-IN')}
                        {m.withdrawn_amount > 0 && (
                          <div className="text-[9px] text-rose-400 font-bold">Withdrawn: ₹{m.withdrawn_amount.toLocaleString('en-IN')}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setActiveMember(m);
                            setTxType('WITHDRAWAL');
                            setTxAmount('');
                            setTxNotes('');
                          }}
                          disabled={!sqlReady}
                          className="px-3 py-1.5 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-200 hover:text-emerald-300 disabled:opacity-30 transition-all"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Transaction Modal */}
      {activeMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0c14] border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Saving Transaction</p>
                <h3 className="text-lg font-black text-white uppercase">{activeMember.member_name}</h3>
              </div>
              <button onClick={() => setActiveMember(null)} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="bg-white/5 rounded-2xl p-3 flex justify-between text-xs font-bold">
              <span className="text-slate-400">Current Saving Balance:</span>
              <span className="text-emerald-400 font-black">₹{activeMember.saving_balance.toLocaleString('en-IN')}</span>
            </div>

            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Type</label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value)}
                  className="w-full bg-[#05050a] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white"
                >
                  <option value="WITHDRAWAL">Saving Withdrawal (Return to Member)</option>
                  <option value="WEEKLY_SAVING">Manual Saving Deposit</option>
                  <option value="STP">STP Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-[#05050a] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notes</label>
                <input
                  type="text"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  placeholder="Optional remark"
                  className="w-full bg-[#05050a] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white"
                />
              </div>

              <button
                type="submit"
                disabled={txLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                {txLoading ? 'Saving...' : 'Confirm Entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
