import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShield, FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const MotionDiv = motion.div;
const MotionButton = motion.button;

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await login(email, password, 'admin');
      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="container" style={{ maxWidth: '100%', width: '100%' }}>
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card login-card">
            <div className="login-header">
              <div className="login-icon">
                <FiShield size={20} color="#007AFF" />
              </div>
              <h2 className="heading-2" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>Admin Login</h2>
              <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                Sign in to access the admin dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <div className="input-group">
                  <FiMail className="input-left-icon" size={18} />
                  <input
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter admin email"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="input-group">
                  <FiLock className="input-left-icon" size={18} />
                  <input
                    type="password"
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="alert alert-error">
                  <FiAlertCircle size={18} />
                  {error}
                </div>
              )}

              <MotionButton
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </MotionButton>
            </form>

            <div className="login-footer">
              <span className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                Not an admin?{' '}
              </span>
              <Link to="/member/login" className="login-link">
                Member Login
              </Link>
            </div>
          </div>
        </MotionDiv>
      </div>
    </div>
  );
};

export default AdminLogin;
