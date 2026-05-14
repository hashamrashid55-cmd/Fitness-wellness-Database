import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import MemberDashboard from './pages/MemberDashboard';

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" replace />;
  if (role && user.user_type !== role) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { background:'#1a2035', color:'#f0f4ff', border:'1px solid rgba(108,99,255,0.3)' } }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin"   element={<ProtectedRoute role="ADMIN">  <AdminDashboard /></ProtectedRoute>} />
        <Route path="/trainer" element={<ProtectedRoute role="TRAINER"><TrainerDashboard /></ProtectedRoute>} />
        <Route path="/member"  element={<ProtectedRoute role="MEMBER"> <MemberDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
