import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const MotionDiv = motion.div;
const MotionButton = motion.button;

const MemberLogin = () => {
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
      const result = await login(email, password, 'member');
      if (result.success) {
        navigate('/member/dashboard');
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
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}
            >
              <img 
                src="/DVscan.png" 
                alt="DVcheck Logo" 
                className="login-logo"
              />
            </MotionDiv>
            <div className="login-header">
              <h2 className="heading-2" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>Member Login</h2>
              <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                Sign in to access the member dashboard
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
                    placeholder="Enter member email"
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

          </div>
        </MotionDiv>
      </div>
    </div>
  );
};

export default MemberLogin;
