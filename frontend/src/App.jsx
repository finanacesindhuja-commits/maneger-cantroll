import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ManagerLogin from './page/ManagerLogin';
import Dashboard from './page/Dashboard';
import Loans from './page/Loans';
import ScheduleDate from './page/ScheduleDate';
import Collections from './page/Collections';
import Staffs from './page/Staffs';
import PendingCollections from './page/PendingCollections';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<ManagerLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/schedule-date" element={<ScheduleDate />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/staffs" element={<Staffs />} />
        <Route path="/pending-collections" element={<PendingCollections />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
