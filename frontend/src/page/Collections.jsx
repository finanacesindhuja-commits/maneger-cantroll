import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, FaCheckCircle, FaHistory, FaUserCircle, FaBars 
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

  const [schedules, setSchedules] = useState([]);
  const [monitorDate, setMonitorDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`${API_URL}/api/schedules`);
      const data = await res.json();
      if (res.ok) setSchedules(data);
    } catch (err) { console.error('Schedules error:', err); }
  };


  const handleAcceptStaff = async (sid) => {
    try {
      const res = await fetch(`${API_URL}/api/schedules/receive-staff-bulk`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: sid, scheduledDate: monitorDate, managerId: staffId })
      });
      if (res.ok) fetchSchedules();
    } catch (err) { console.error('Staff accept error:', err); }
  };

  const [expandedStaff, setExpandedStaff] = useState(null);

  const staffSummaries = schedules
    .filter(s => s.scheduled_date === monitorDate)
    .reduce((acc, s) => {
      const sid = s.staff_id || 'N/A';
      if (!acc[sid]) {
        acc[sid] = {
          staff_id: sid,
          staff_name: s.staff_name || 'Unknown',
          branch: s.branch || 'N/A',
          amount: 0,
          collected: 0,
          received: true,
          centers: {}
        };
      }
      const amt = Number(s.amount) || 0;
      acc[sid].amount += amt;
      
      const cid = s.center_id;
      if (!acc[sid].centers[cid]) {
        acc[sid].centers[cid] = {
          center_id: cid,
          center_name: s.center_name,
          amount: 0,
          collected: 0,
          received: true
        };
      }
      acc[sid].centers[cid].amount += amt;

      if (s.status === 'Received') {
        acc[sid].collected += amt;
        acc[sid].centers[cid].collected += amt;
      } else {
        acc[sid].received = false;
        acc[sid].centers[cid].received = false;
      }

      return acc;
    }, {});

  const displayList = Object.values(staffSummaries);
  const totalTarget = displayList.reduce((sum, s) => sum + s.amount, 0);
  const totalCollected = displayList.reduce((sum, s) => sum + s.collected, 0);

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
              <h1 className="text-md md:text-2xl font-black text-white tracking-tight">Daily Collections</h1>
            </div>
          </div>
          <button onClick={() => window.location.reload()} className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-indigo-400 transition-all">
            <FaHistory />
          </button>
        </header>

        {/* Day-wise Collection Monitor */}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[120px] pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-lg">
                <FaCalendarAlt size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Daily Collection Tracker</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Live Operational Status</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#0a0f1c] p-2 rounded-2xl border border-white/10 shadow-inner">
              <label className="text-[9px] font-black text-slate-500 uppercase px-3">Filter Date</label>
              <input 
                type="date" 
                value={monitorDate} 
                onChange={(e) => setMonitorDate(e.target.value)}
                className="bg-white/5 border-none rounded-xl px-4 py-2 text-white text-xs font-bold focus:ring-0 cursor-pointer hover:bg-white/10 transition-all font-mono"
              />
            </div>
          </div>

          {/* Collection Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-500/20 flex flex-col justify-between active:scale-[0.98] transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-white/20 transition-all"></div>
              <div>
                <p className="text-[10px] text-white/70 font-black uppercase tracking-[0.2em] mb-2">Total Target</p>
                <h3 className="text-4xl font-black text-white tracking-tighter">
                  ₹{totalTarget.toLocaleString()}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-white/90 uppercase bg-white/10 backdrop-blur-sm self-start px-4 py-2 rounded-xl mt-6 border border-white/10">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                {displayList.length} Active Staff
              </div>
            </div>
            
            <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all"></div>
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Total Received</p>
                <h3 className="text-4xl font-black text-emerald-400 tracking-tighter">
                  ₹{totalCollected.toLocaleString()}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase bg-emerald-500/10 self-start px-4 py-2 rounded-xl mt-6 border border-emerald-500/10">
                {totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0}% Completed
              </div>
            </div>

            <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 flex flex-col justify-center text-center">
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Monitoring Branch</p>
                <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                  {branch || 'All Branches'}
                </h3>
                <p className="text-[9px] text-slate-600 font-bold uppercase mt-1 tracking-widest">
                  Remaining: ₹{(totalTarget - totalCollected).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.01] rounded-[1.5rem] md:rounded-[2rem] border border-white/5 overflow-hidden">
              <div className="overflow-x-auto block">
                <table className="w-full text-left border-collapse block md:table">
                  <thead className="hidden md:table-header-group">
                    <tr className="text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-white/5 bg-white/[0.01]">
                      <th className="px-8 py-5">Branch</th>
                      <th className="px-8 py-5">Staff ID</th>
                      <th className="px-8 py-5">Staff Name</th>
                      <th className="px-8 py-5 text-right">Target Amount</th>
                      <th className="px-8 py-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="block md:table-row-group divide-y divide-white/5">
                    {displayList.length === 0 ? (
                      <tr className="block md:table-row">
                        <td colSpan="5" className="px-8 py-16 text-center block md:table-cell">
                          <FaCalendarAlt className="mx-auto text-slate-700 mb-2 opacity-20" size={32} />
                          <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">No staff collections for this date</p>
                        </td>
                      </tr>
                    ) : (
                      displayList.map((staff) => (
                        <React.Fragment key={staff.staff_id}>
                          <tr 
                            onClick={() => setExpandedStaff(expandedStaff === staff.staff_id ? null : staff.staff_id)}
                            className={`hover:bg-white/[0.02] transition-colors group cursor-pointer block md:table-row p-4 md:p-0 ${expandedStaff === staff.staff_id ? 'bg-white/[0.03]' : ''}`}
                          >
                            <td className="px-4 md:px-8 py-4 md:py-6 block md:table-cell">
                              <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Branch</span>
                              <span className="text-[10px] font-bold text-slate-400 border border-white/10 px-2 py-1 rounded-lg">{staff.branch}</span>
                            </td>
                            <td className="px-4 md:px-8 py-4 md:py-6 block md:table-cell">
                              <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Staff ID</span>
                              <span className="text-[10px] font-black text-indigo-400 uppercase bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">{staff.staff_id}</span>
                            </td>
                            <td className="px-4 md:px-8 py-4 md:py-6 block md:table-cell">
                              <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Staff Name</span>
                              <span className="text-xs font-bold text-slate-200 uppercase">{staff.staff_name}</span>
                            </td>
                            <td className="px-4 md:px-8 py-4 md:py-6 font-black text-white text-lg text-left md:text-right block md:table-cell">
                              <span className="md:hidden text-[9px] text-slate-500 uppercase block mb-1">Total Target</span>
                              ₹{staff.amount.toLocaleString()}
                            </td>
                            <td className="px-4 md:px-8 py-4 md:py-6 text-left md:text-right block md:table-cell">
                               <div className="flex items-center justify-end gap-3">
                                 {!staff.received ? (
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleAcceptStaff(staff.staff_id);
                                     }}
                                     className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                                   >
                                     <FaCheckCircle size={10} /> Accept All
                                   </button>
                                 ) : (
                                   <span className="text-[10px] font-black uppercase px-3 py-1 rounded-lg border text-indigo-400 bg-indigo-500/10 border-indigo-500/20">
                                     Received
                                   </span>
                                 )}
                               </div>
                            </td>
                          </tr>
                          
                          {/* Expanded View: Centers under this Staff */}
                          {expandedStaff === staff.staff_id && (
                            <tr className="bg-black/40 block md:table-row">
                              <td colSpan="5" className="p-0 block md:table-cell">
                                <div className="p-6 md:px-12 md:py-8 space-y-4">
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1 h-1 bg-indigo-500 rounded-full"></span> Assigned Centers
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.values(staff.centers).map((center) => (
                                      <div key={center.center_id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col justify-between group hover:border-indigo-500/50 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                          <div>
                                            <h4 className="text-white font-bold text-sm uppercase">{center.center_name}</h4>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Target: ₹{center.amount.toLocaleString()}</p>
                                          </div>
                                          {center.received ? (
                                            <FaCheckCircle className="text-indigo-500" size={16} />
                                          ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-slate-700"></div>
                                          )}
                                        </div>
                                        
                                        <div className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-center border ${center.received ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                                          {center.received ? 'Received' : 'Pending'}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
            </div>
          </div>
        </div>


      </main>
    </div>
  );
}
