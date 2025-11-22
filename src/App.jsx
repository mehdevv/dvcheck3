import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import MemberLogin from './pages/MemberLogin';
import AdminDashboard from './pages/AdminDashboard';
import MemberDashboard from './pages/MemberDashboard';
import EventsManagement from './pages/EventsManagement';
import ProtectedRoute from './components/ProtectedRoute';
import FirestoreWarning from './components/FirestoreWarning';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <>
      <FirestoreWarning />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/admin/login" 
          element={user?.type === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />} 
        />
        <Route 
          path="/member/login" 
          element={user?.type === 'member' ? <Navigate to="/member/dashboard" replace /> : <MemberLogin />} 
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredType="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute requiredType="admin">
              <EventsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/dashboard"
          element={
            <ProtectedRoute requiredType="member">
              <MemberDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
