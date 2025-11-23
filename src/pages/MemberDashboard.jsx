import { motion } from 'framer-motion';
import { FiLogOut, FiUser, FiMail, FiPhone, FiHash, FiUser as FiUserCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import QRCodeDisplay from '../components/QRCodeDisplay';
import './MemberDashboard.css';

const MotionDiv = motion.div;

const MemberDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="member-dashboard-page">
      <div className="member-dashboard-container">
        {/* Header */}
        <div className="member-dashboard-header">
          <h1 className="member-dashboard-title">DVcheck</h1>
          <button
            className="member-dashboard-logout-btn"
            onClick={logout}
            aria-label="Logout"
          >
            <FiLogOut size={20} />
          </button>
        </div>

        {/* QR Code Card */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="member-qr-card"
        >
          <div className="member-qr-content">
            <h2 className="member-qr-title">Membership QR Code</h2>
            <QRCodeDisplay 
              name={user?.name}
              email={user?.email}
              qrData={user?.qrCodeData}
            />
          </div>
        </MotionDiv>

        {/* Your Information Section */}
        <div className="member-info-section">
          <h2 className="member-info-section-title">Your Information</h2>
          
          <div className="member-info-list">
            {/* Name */}
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="member-info-item">
                <div className="member-info-icon">
                  <FiUser size={20} />
                </div>
                <div className="member-info-content">
                  <div className="member-info-label">Name</div>
                  <div className="member-info-value">{user?.name || 'N/A'}</div>
                </div>
              </div>
            </MotionDiv>

            {/* Email */}
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="member-info-item">
                <div className="member-info-icon">
                  <FiMail size={20} />
                </div>
                <div className="member-info-content">
                  <div className="member-info-label">Email</div>
                  <div className="member-info-value member-info-value-break">{user?.email || 'N/A'}</div>
                </div>
              </div>
            </MotionDiv>

            {/* Member ID */}
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="member-info-item">
                <div className="member-info-icon">
                  <FiHash size={20} />
                </div>
                <div className="member-info-content">
                  <div className="member-info-label">Member ID</div>
                  <div className="member-info-value">{user?.id || 'N/A'}</div>
                </div>
              </div>
            </MotionDiv>

            {/* Account Type */}
            <MotionDiv
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className="member-info-item">
                <div className="member-info-icon">
                  <FiUserCircle size={20} />
                </div>
                <div className="member-info-content">
                  <div className="member-info-label">Account Type</div>
                  <div className="member-info-value">Member</div>
                </div>
              </div>
            </MotionDiv>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
