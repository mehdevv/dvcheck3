import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredType }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div style={{ fontSize: '16px', color: '#6e6e73' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={requiredType === 'admin' ? '/DV/login' : '/member/login'} replace />;
  }

  if (user.type !== requiredType) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

