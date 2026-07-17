import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { FaPrint, FaSpinner, FaTimes, FaUser } from 'react-icons/fa';
import { useReactToPrint } from 'react-to-print';
import { API_URL } from '../config';

export default function GroupLoanAgreement() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [centers, setCenters] = useState([]);
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);

  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const [leaderNameInput, setLeaderNameInput] = useState('');
  const [managerNameInput, setManagerNameInput] = useState('');
  const [secretaryNameInput, setSecretaryNameInput] = useState('');
  const [groupLeaderName, setGroupLeaderName] = useState('');
  const [groupSecretaryName, setGroupSecretaryName] = useState('');
  const [branchManagerName, setBranchManagerName] = useState('');
  const [pendingCenterId, setPendingCenterId] = useState('');

  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'Group_Loan_Agreement',
  });

  useEffect(() => {
    fetchCenters();
  }, []);

  useEffect(() => {
    if (selectedCenterId) {
      fetchMembers(selectedCenterId);
    } else {
      setMembers([]);
    }
  }, [selectedCenterId]);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/centers`);
      const data = await res.json();
      if (res.ok) {
        const approvedCenters = (Array.isArray(data) ? data : []).filter(c =>
          c.stage === 'DISBURSEMENT'
        );
        setCenters(approvedCenters);
      }
    } catch (err) {
      console.error('Error fetching centers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (centerId) => {
    try {
      setMembersLoading(true);
      const res = await fetch(`${API_URL}/api/centers/${centerId}/members`);
      const data = await res.json();
      if (res.ok) {
        setMembers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  // When center is selected, open popup
  const handleCenterChange = (e) => {
    const val = e.target.value;
    if (val) {
      setPendingCenterId(val);
      setLeaderNameInput('');
      setSecretaryNameInput('');
      setManagerNameInput('');
      setGroupLeaderName('');
      setGroupSecretaryName('');
      setBranchManagerName('');
      setShowPopup(true);
    } else {
      setSelectedCenterId('');
      setGroupLeaderName('');
      setGroupSecretaryName('');
      setBranchManagerName('');
      setMembers([]);
    }
  };

  // Confirm popup - save leader name and branch manager name and set center
  const handlePopupConfirm = () => {
    if (!leaderNameInput.trim()) return;
    setGroupLeaderName(leaderNameInput.trim());
    setGroupSecretaryName(secretaryNameInput.trim());
    setBranchManagerName(managerNameInput.trim());
    setSelectedCenterId(pendingCenterId);
    setShowPopup(false);
  };

  // Cancel popup
  const handlePopupCancel = () => {
    setShowPopup(false);
    setPendingCenterId('');
    setSelectedCenterId('');
    setGroupLeaderName('');
    setGroupSecretaryName('');
    setBranchManagerName('');
  };

  const selectedCenter = centers.find(c => c.id.toString() === selectedCenterId.toString());
  const principalAmount = selectedCenter?.amount || 0;
  const today = new Date().toLocaleDateString('en-GB');

  return (
    <div className="min-h-screen bg-[#050508] text-slate-300 font-sans selection:bg-indigo-500/30">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* Group Leader Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 relative animate-in fade-in slide-in-from-bottom-4">
            {/* Close */}
            <button
              onClick={handlePopupCancel}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <FaTimes />
            </button>

            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl mb-4 mx-auto">
              <FaUser className="text-indigo-400 text-xl" />
            </div>

            {/* Center Name Badge */}
            {(() => {
              const pc = centers.find(c => c.id.toString() === pendingCenterId.toString());
              return pc ? (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 text-center mb-4">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Selected Center</p>
                  <p className="text-white font-black uppercase text-base">{pc.name}</p>
                  <p className="text-emerald-400 text-xs font-black mt-1">₹ {pc.amount?.toLocaleString('en-IN')} Sanctioned</p>
                </div>
              ) : null;
            })()}

            <h2 className="text-xl font-black text-white text-center mb-1">Agreement Details</h2>
            <p className="text-xs text-slate-500 text-center mb-6 uppercase tracking-widest">விவரங்களை உள்ளிடவும்</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Group Leader Name / குழுத் தலைவர்</label>
                <input
                  type="text"
                  autoFocus
                  value={leaderNameInput}
                  onChange={(e) => setLeaderNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && document.getElementById('sec-input').focus()}
                  placeholder="Leader Name / பெயர்"
                  className="w-full bg-[#161b27] border border-white/10 rounded-xl px-4 py-3 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center text-sm uppercase"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Group Secretary Name / செயலாளர்</label>
                <input
                  id="sec-input"
                  type="text"
                  value={secretaryNameInput}
                  onChange={(e) => setSecretaryNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && document.getElementById('mgr-input').focus()}
                  placeholder="Secretary Name / பெயர்"
                  className="w-full bg-[#161b27] border border-white/10 rounded-xl px-4 py-3 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center text-sm uppercase"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Branch Manager Name / கிளை மேலாளர்</label>
                <input
                  id="mgr-input"
                  type="text"
                  value={managerNameInput}
                  onChange={(e) => setManagerNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePopupConfirm()}
                  placeholder="Manager Name / பெயர்"
                  className="w-full bg-[#161b27] border border-white/10 rounded-xl px-4 py-3 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-center text-sm uppercase"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePopupCancel}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePopupConfirm}
                disabled={!leaderNameInput.trim()}
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm transition-colors shadow-lg shadow-indigo-500/20"
              >
                Confirm & Load
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-72' : 'lg:ml-72'}`}>
        <header className="sticky top-0 z-40 bg-[#050508]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Group Loan Agreement</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm font-semibold shadow-lg shadow-indigo-500/20"
            >
              <FaPrint /> Print / PDF
            </button>
          </div>
        </header>

        <main className="p-4 md:p-8 overflow-x-auto">
          <div className="max-w-3xl mx-auto mb-8 bg-slate-800/40 backdrop-blur border border-white/5 rounded-2xl p-6 shadow-xl">
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4">Select Approved Center</h2>
            {loading ? (
              <div className="flex items-center gap-3 text-amber-500">
                <FaSpinner className="animate-spin" /> Loading centers...
              </div>
            ) : (
              <select
                value={selectedCenterId}
                onChange={handleCenterChange}
                className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 transition-all font-bold appearance-none"
              >
                <option value="">-- Choose Center --</option>
                {centers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.branch}) - ₹{c.amount?.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            )}

            {/* Show selected leader name */}
            {groupLeaderName && (
              <div className="mt-4 flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3">
                <FaUser className="text-indigo-400" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Group Leader</p>
                  <p className="text-white font-black uppercase">{groupLeaderName}</p>
                </div>
                <button
                  onClick={() => { setShowPopup(true); setLeaderNameInput(groupLeaderName); setSecretaryNameInput(groupSecretaryName); setPendingCenterId(selectedCenterId); }}
                  className="ml-auto text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest"
                >
                  Edit
                </button>
              </div>
            )}

            {membersLoading && (
              <div className="mt-4 flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                <FaSpinner className="animate-spin" /> Fetching members...
              </div>
            )}
          </div>

          <div className="flex justify-center min-w-[210mm] pb-12">
            {/* Premium A4 Document */}
            <div
              ref={componentRef}
              className="bg-white text-slate-900 shadow-2xl print:shadow-none print:m-0 relative overflow-hidden"
              style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '10mm 15mm',
                boxSizing: 'border-box'
              }}
            >
              {/* Header Branding */}
              <div className="border-b-2 border-indigo-600 pb-2 mb-3 flex items-start justify-between">
                {/* Left - Brand & Logo */}
                <div className="flex items-center gap-4">
                  <img src="/logo.png" alt="Logo" className="h-24 w-24 object-contain" onError={(e) => e.target.style.display = 'none'} />
                  <div className="flex flex-col justify-center">
                    <h1 className="text-3xl font-black text-indigo-900 tracking-tighter uppercase leading-none">SINDHUJA.FIN</h1>
                    <p className="text-sm font-black text-slate-500 tracking-widest uppercase mt-1 text-right">Finance</p>
                  </div>
                </div>
                {/* Right - Date */}
                <div className="text-right self-end pb-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date</p>
                  <p className="text-sm font-black text-slate-700">{selectedCenter ? today : 'DD / MM / YYYY'}</p>
                </div>
              </div>

              {/* Title - Center */}
              <div className="text-center mb-3">
                <h2 className="text-xl font-black text-indigo-900 tracking-widest uppercase underline underline-offset-4">GROUP LOAN AGREEMENT</h2>
              </div>

              {/* Two Column Details Grid */}
              <div className="grid grid-cols-2 gap-6 mb-4">
                {/* Group Details */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span> Group Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500 font-semibold">Group Name:</span>
                      <span className="font-bold text-slate-900">{selectedCenter?.name || '---'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500 font-semibold">Group ID:</span>
                      <span className="font-bold text-slate-900">{selectedCenter?.id || '---'}</span>
                    </div>

                   
                  </div>
                </div>

                {/* Loan Details */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Loan Terms
                  </h3>
                  <ul className="space-y-3 text-sm list-none">
                    <li className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500 font-semibold">Group Sanction Amount:</span>
                      <span className="font-black text-emerald-700">{principalAmount > 0 ? `₹ ${principalAmount.toLocaleString('en-IN')}` : '---'}</span>
                    </li>
                     <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500 font-semibold">Group Leader:</span>
                      <span className="font-black text-indigo-900">{groupLeaderName || '---'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500 font-semibold">Group Secretary:</span>
                      <span className="font-black text-indigo-900">{groupSecretaryName || '---'}</span>
                    </div>
                  </ul>
                </div>
              </div>

              {/* Terms and Conditions (Tamil) */}
              <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium" style={{ pageBreakInside: 'avoid' }}>
                <h4 className="font-black text-slate-900 uppercase mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span> குழு கடன் நிபந்தனைகள் மற்றும் உறுதிமொழி
                </h4>
                <ul className="list-disc pl-4 space-y-1 font-semibold text-[9px] columns-2 gap-8 text-justify">
                  <li>ஒரு குழுவில் குறைந்தபட்சம் 5 உறுப்பினர்கள் மற்றும் அதிகபட்சம் 20 உறுப்பினர்கள் இருக்க வேண்டும்.</li>
                  <li>அனைத்து உறுப்பினர்களும் 18 முதல் 60 வயதுக்குள் இருக்க வேண்டும்.</li>
                  <li>ஒவ்வொரு உறுப்பினரும் செல்லுபடியாகும் அடையாள ஆவணம் (ஆதார் அட்டை, வாக்காளர் அட்டை போன்றவை) மற்றும் முகவரி சான்று வழங்க வேண்டும்.</li>
                  <li>குழுவின் அனைத்து உறுப்பினர்களும் கடன் திருப்பிச் செலுத்தும் பொறுப்பை பகிர்ந்து கொள்ள வேண்டும் (Joint Liability).</li>
                  <li>வாராந்திர அல்லது மாதாந்திர தவணைகள் குறிப்பிட்ட தேதியில் கட்டப்பட வேண்டும்.</li>
                  <li>ஒரு உறுப்பினர் தவணையை செலுத்த முடியாத நிலையில், குழுவின் மற்ற உறுப்பினர்கள் அந்த தொகையை செலுத்த ஒப்புக்கொள்ள வேண்டும்.</li>
                  <li>கடன் தொகை தொழில், விவசாயம், கால்நடை வளர்ப்பு, சிறு வணிகம் போன்ற உற்பத்தி நோக்கங்களுக்காக பயன்படுத்தப்பட வேண்டும்.</li>
                  <li>தவணை தாமதமானால் அபராத கட்டணம் விதிக்கப்படலாம்.</li>
                  <li>கடன் காலம் முடிவடையும் முன் முழு தொகையையும் செலுத்தும் வசதி வழங்கப்படலாம்.</li>
                  <li>குழு கூட்டங்களில் உறுப்பினர்கள் தவறாமல் கலந்து கொள்ள வேண்டும்.</li>
                  <li>தவறான தகவல் அல்லது போலி ஆவணங்கள் வழங்கப்பட்டால் கடன் ரத்து செய்யப்படும்.</li>
                  <li>நிறுவன விதிமுறைகள் மற்றும் ஒப்பந்த நிபந்தனைகளை அனைத்து உறுப்பினர்களும் ஏற்க வேண்டும்.</li>
                  <li>குழுவில் உள்ள அனைத்து உறுப்பினர்களும் ஒரே கிராமம் அல்லது அருகிலுள்ள பகுதிகளில் வசிப்பவர்களாக இருக்க வேண்டும்.</li>
                  <li>ஒரே குடும்பத்தைச் சேர்ந்த அதிகமான உறுப்பினர்கள் ஒரே குழுவில் சேர அனுமதி இல்லை.</li>
                  <li>ஒவ்வொரு உறுப்பினரும் கடன் பெறுவதற்கு முன் KYC சரிபார்ப்பு முடிக்கப்பட்டிருக்க வேண்டும்.</li>
                  <li>உறுப்பினர்கள் மற்ற நிதி நிறுவனங்களில் அதிக நிலுவைக் கடன்கள் இல்லாமல் இருக்க வேண்டும்.</li>
                  <li>குழுவின் தலைவர் மற்றும் செயலாளர் தேர்வு செய்யப்பட வேண்டும்.</li>
                  <li>குழுவின் வாராந்திர அல்லது மாதாந்திர கூட்டங்கள் முறையாக நடத்தப்பட வேண்டும்.</li>
                  <li>கடன் தொகையை தனிப்பட்ட ஆடம்பர செலவுகளுக்கு பயன்படுத்தக்கூடாது.</li>
                  <li>கடன் தொகை விவசாயம், கால்நடை வளர்ப்பு, சிறு தொழில், வணிகம் அல்லது வருமானம் ஈட்டும் நடவடிக்கைகளுக்கு மட்டுமே பயன்படுத்தப்பட வேண்டும்.</li>
                  <li>தவணை செலுத்தாத உறுப்பினர்களுக்கு புதிய கடன் வழங்கப்படாது.</li>
                  <li>2 அல்லது 3 தவணைகளுக்கு மேல் நிலுவை இருந்தால் கணக்கு NPA ஆக வகைப்படுத்தப்படலாம்.</li>
                  <li>உறுப்பினர் முகவரி அல்லது தொலைபேசி எண் மாற்றப்பட்டால் உடனடியாக நிறுவனத்திற்கு தெரிவிக்க வேண்டும்.</li>
                  <li>கடன் பெறும் போது உறுப்பினரின் புகைப்படம் மற்றும் ஆவணங்கள் சேகரிக்கப்படும்.</li>
                  <li>கடன் தொகை உறுப்பினரின் வங்கி கணக்கில் மட்டுமே செலுத்தப்படும்.</li>
                  <li>உறுப்பினர் மரணம் அல்லது நிரந்தர உடல்நலக்குறைவு ஏற்பட்டால் நிறுவன விதிமுறைகளின்படி நடவடிக்கை எடுக்கப்படும்.</li>
                  <li>குழுவில் ஒற்றுமை மற்றும் ஒழுங்கை பராமரிப்பது அனைத்து உறுப்பினர்களின் பொறுப்பாகும்.</li>
                  <li>நிறுவன ஊழியர்களுக்கு தவறான தகவல் வழங்குவது அல்லது மோசடி செய்வது கண்டறியப்பட்டால் கடன் உடனடியாக ரத்து செய்யப்படும்.</li>
                  <li>குழுவின் அனைத்து உறுப்பினர்களும் கடன் ஒப்பந்தத்தில் கையொப்பமிட வேண்டும்.</li>
                  <li>கடன் வழங்கும் நிறுவனத்தின் விதிமுறைகள் காலம்தோறும் மாற்றப்படலாம்; அவற்றை உறுப்பினர்கள் ஏற்க வேண்டும்.</li>
                  <li>ஒரு உறுப்பினர் குழுவை விட்டு வெளியேற வேண்டுமெனில் நிறுவனத்தின் முன் அனுமதி பெற வேண்டும்.</li>
                  <li>குழு உறுப்பினர்களின் பரிந்துரை மற்றும் ஒப்புதலின் அடிப்படையில் மட்டுமே புதிய உறுப்பினர்கள் சேர்க்கப்படுவர்.</li>
                  <li>கடன் தொகை வழங்கப்பட்ட பின்னர் நிறுவன அதிகாரிகள் பயன்பாட்டை சரிபார்க்க நேரடி ஆய்வு மேற்கொள்ளலாம்.</li>
                  <li>உறுப்பினர்கள் தவணைகளை நேரத்தில் செலுத்துவது எதிர்கால அதிக கடன் தகுதிக்கு உதவும்.</li>
                  <li>அனைத்து உறுப்பினர்களும் குழு ஒற்றுமை மற்றும் பரஸ்பர பொறுப்பை கடைபிடிக்க வேண்டும்.</li>
                </ul>
              </div>

              {/* Members Table */}
              <div className="mb-4">
                <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-2 border-l-4 border-indigo-500 pl-3">Member Signatures</h3>
                <table className="w-full text-sm border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700">
                      <th className="border border-slate-300 py-2 px-3 text-left w-10 font-bold uppercase tracking-widest text-[10px]">S.No</th>
                      <th className="border border-slate-300 py-2 px-3 text-left font-bold uppercase tracking-widest text-[10px]">Member Details</th>
                      <th className="border border-slate-300 py-2 px-3 text-center w-32 font-bold uppercase tracking-widest text-[10px]">Approved Amount</th>
                      <th className="border border-slate-300 py-2 px-3 text-left w-48 font-bold uppercase tracking-widest text-[10px]">Signature / Thumbprint</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(members.length > 0 ? members : Array(10).fill({})).map((member, idx) => (
                      <tr key={member.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="border border-slate-300 py-2 px-3 font-black text-slate-400 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 py-2 px-3">
                          {member.name ? (
                            <div>
                              <div className="font-black text-slate-800 uppercase">{member.name}</div>
                              <div className="text-[10px] text-indigo-600 font-black tracking-widest uppercase mt-0.5">ID: {member.member_no || member.id}</div>
                            </div>
                          ) : (
                            <div className="text-slate-300 italic">No Member</div>
                          )}
                        </td>
                        <td className="border border-slate-300 py-2 px-3 text-center">
                          <span className="font-black text-emerald-700 text-sm">
                            {member.loan_amount
                              ? `₹ ${Number(member.loan_amount).toLocaleString('en-IN')}`
                              : member.name && principalAmount > 0 && members.length > 0
                                ? `₹ ${Math.floor(principalAmount / members.length).toLocaleString('en-IN')}`
                                : ''}
                          </span>
                        </td>
                        <td className="border border-slate-300 py-2 px-3 text-center">
                          <span className="text-[9px] text-slate-300 uppercase tracking-widest">Sign Here</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>



              {/* Office Declaration */}
              <div className="mb-4 p-3 border border-indigo-200 bg-indigo-50/50 rounded-xl" style={{ pageBreakInside: 'avoid' }}>
                <h4 className="font-black text-indigo-900 uppercase text-xs mb-2">Office Declaration / அலுவலக உறுதிமொழி</h4>
                <p className="text-[11px] text-slate-700 font-bold leading-relaxed text-justify">
                  மேற்கண்ட குழு உறுப்பினர்களின் ஆவணங்கள், இருப்பிடம் மற்றும் பின்னணி ஆகியவற்றை நேரடியாகச் சரிபார்த்துள்ளேன். இவர்கள் அனைவரும் நிறுவனத்தின் விதிமுறைகளுக்கு உட்பட்டு கடன் பெறத் தகுதியானவர்கள் எனச் சான்றளிக்கிறேன். இந்தக் குழுவிற்கான கடன் விண்ணப்பத்தை முழு மனதுடன் அங்கீகரிக்கப் பரிந்துரைக்கிறேன் / ஒப்புதல் அளிக்கிறேன்.
                </p>
              </div>

              {/* Signatures Footer */}
              <div className="mt-4 flex justify-between items-end px-8" style={{ pageBreakInside: 'avoid' }}>
                <div className="text-center w-48">
                  <div className="w-48 border-b-2 border-slate-400 mb-2 mt-4"></div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Group Leader</p>
                  <p className="text-[11px] text-indigo-900 font-black mt-1 uppercase">{groupLeaderName || '(பெயர் / Name)'}</p>
                </div>
                <div className="text-center w-48">
                  <div className="w-48 border-b-2 border-slate-400 mb-2 mt-4"></div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Branch Manager</p>
                  <p className="text-[11px] text-slate-900 font-black mt-1 uppercase">{branchManagerName || '(பெயர் / Name)'}</p>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
