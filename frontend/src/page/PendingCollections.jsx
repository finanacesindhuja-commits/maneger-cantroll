import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Users, Clock, Calendar, RefreshCw, 
  User, Menu, Search, Filter, AlertCircle, ChevronRight, DollarSign, Building2, UserCheck
} from 'lucide-react';
import { API_URL } from '../config';
import Sidebar from '../components/Sidebar';

export default function PendingCollections() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const userName = localStorage.getItem('name');
  const staffId = localStorage.getItem('staffId');
  const branch = localStorage.getItem('branch');

  if (role !== 'Manager') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030303] text-white flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="bg-[#09090e]/60 backdrop-blur-xl border border-red-500/20 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_8px_32px_rgba(239,68,68,0.05)]">
          <h2 className="text-2xl font-black text-red-500 mb-2 tracking-tight">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-6">You do not have manager privileges to view this page.</p>
          <button 
            onClick={() => navigate('/login')} 
            className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl active:scale-[0.98] transition-all shadow-lg shadow-red-950/20"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/schedules`);
      const data = await res.json();
      if (res.ok) {
        setSchedules(data);
      }
    } catch (err) {
      console.error('Schedules fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Filter schedules that are unpaid (status !== Received and status !== Paid) and due up to today
  const pendingSchedules = useMemo(() => {
    return schedules.filter(s => s.status !== 'Received' && s.status !== 'Paid' && s.scheduled_date <= todayStr);
  }, [schedules, todayStr]);

  // Unique staff options for filter
  const staffOptions = useMemo(() => {
    const staffSet = new Set(pendingSchedules.map(s => s.staff_name).filter(Boolean));
    return ['All', ...Array.from(staffSet)];
  }, [pendingSchedules]);

  // Unique branch options for filter
  const branchOptions = useMemo(() => {
    const branchSet = new Set(pendingSchedules.map(s => s.branch).filter(Boolean));
    return ['All', ...Array.from(branchSet)];
  }, [pendingSchedules]);

  // Filtered list based on Search & Select filters
  const filteredSchedules = useMemo(() => {
    return pendingSchedules.filter(s => {
      const matchesSearch = 
        (s.member_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.center_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.member_id || '').toString().includes(searchQuery);

      const matchesStaff = selectedStaff === 'All' || s.staff_name === selectedStaff;
      const matchesBranch = selectedBranch === 'All' || s.branch === selectedBranch;

      return matchesSearch && matchesStaff && matchesBranch;
    });
  }, [pendingSchedules, searchQuery, selectedStaff, selectedBranch]);

  // Calculated statistics
  const statsSummary = useMemo(() => {
    const totalAmount = filteredSchedules.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const uniqueMembers = new Set(filteredSchedules.map(s => s.member_name)).size;
    const totalBills = filteredSchedules.length;

    return { totalAmount, uniqueMembers, totalBills };
  }, [filteredSchedules]);

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 flex font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]"></div>
        <div className="absolute top-[35%] right-[10%] w-[40%] h-[40%] rounded-full bg-rose-500/3 blur-[100px]"></div>
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
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10 shrink-0">
              <Clock className="text-white w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest mb-0.5">{staffId} • {branch || 'General Branch'}</p>
              <h1 className="text-lg md:text-2xl font-black text-white tracking-tight">Pending Bills & Collections</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] text-rose-400 font-extrabold uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
              <span className="w-2 h-2 bg-rose-400 rounded-full animate-ping"></span>
              Overdue List
            </span>
            <button 
              onClick={fetchSchedules} 
              className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-indigo-400 hover:bg-white/10 active:scale-95 transition-all" 
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#09090e]/60 border border-rose-500/20 backdrop-blur-xl p-6 rounded-3xl relative overflow-hidden shadow-[0_0_30px_rgba(244,63,94,0.05)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/10 to-red-500/5 blur-2xl rounded-full opacity-60"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                <DollarSign className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Total Overdue Amount</p>
            <h3 className="text-2xl md:text-3xl font-black text-rose-400 tracking-tight">
              ₹{statsSummary.totalAmount.toLocaleString()}
            </h3>
          </div>

          <div className="bg-[#09090e]/60 border border-white/[0.05] backdrop-blur-xl p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 blur-2xl rounded-full opacity-60"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Unpaid Members</p>
            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {statsSummary.uniqueMembers}
            </h3>
          </div>

          <div className="bg-[#09090e]/60 border border-white/[0.05] backdrop-blur-xl p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 blur-2xl rounded-full opacity-60"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Overdue Installments</p>
            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {statsSummary.totalBills}
            </h3>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-[#09090e]/50 border border-white/[0.05] backdrop-blur-xl rounded-3xl p-5 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center shadow-xl">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search member or center..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/[0.08] hover:border-white/20 rounded-2xl text-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Filter by RO */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/[0.08] rounded-2xl px-3 py-1.5 w-full sm:w-auto">
              <Filter className="text-slate-500 w-3.5 h-3.5" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">RO Staff:</span>
              <select 
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-200 focus:ring-0 cursor-pointer p-0"
              >
                {staffOptions.map(st => (
                  <option key={st} value={st} className="bg-[#0c0c14] text-slate-200">{st}</option>
                ))}
              </select>
            </div>

            {/* Filter by Branch */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/[0.08] rounded-2xl px-3 py-1.5 w-full sm:w-auto">
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
        </div>

        {/* Pending Bills Grid / Table */}
        <div className="bg-[#09090e]/50 border border-white/[0.05] backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/[0.05] text-slate-400 text-[10px] uppercase font-extrabold tracking-widest">
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Center & Branch</th>
                  <th className="px-6 py-4">Relationship Officer (RO)</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Installment</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center text-slate-500 font-bold">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="animate-spin text-indigo-500 w-8 h-8" />
                        <span>Loading overdue bills...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center text-slate-500 font-bold">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 text-slate-600 mb-1" />
                        <span className="uppercase text-[10px] tracking-wider">No pending bills match your filters.</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSchedules.map((schedule) => {
                  const isOverdueToday = schedule.scheduled_date === todayStr;
                  return (
                    <tr key={schedule.id} className="group hover:bg-white/[0.02] transition-all duration-200">
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-white text-sm tracking-tight uppercase group-hover:text-indigo-300 transition-colors">
                          {schedule.member_name}
                        </div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                          Member ID: #{schedule.member_id} • Wk {schedule.week_number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-300 uppercase">{schedule.center_name}</div>
                        <div className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">
                          <Building2 size={10} />
                          {schedule.branch || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-white/5 border border-white/5 flex items-center justify-center font-extrabold text-[8px] text-slate-400 uppercase">
                            {(schedule.staff_name || 'N').split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <div className="font-bold text-slate-300 text-xs">{schedule.staff_name || 'Unknown Staff'}</div>
                            <span className="text-[8px] text-slate-500 font-bold uppercase">ID: {schedule.staff_id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                          isOverdueToday 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                        }`}>
                          <Calendar size={10} />
                          {schedule.scheduled_date} ({schedule.scheduled_day || 'Due'})
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-white text-sm">
                        ₹{(Number(schedule.amount) || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.05)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                          {schedule.status === 'Approved' ? 'Unpaid' : schedule.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
