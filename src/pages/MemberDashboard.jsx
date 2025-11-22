import { useAuth } from '../context/AuthContext';
import QRCodeDisplay from '../components/QRCodeDisplay';
import './Dashboard.css';

const MemberDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Member Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.name || user?.email}</span>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="member-info-card">
          <h2>Your Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Name:</label>
              <span>{user?.name || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{user?.email}</span>
            </div>
            <div className="info-item">
              <label>Member ID:</label>
              <span>{user?.id}</span>
            </div>
            <div className="info-item">
              <label>Account Type:</label>
              <span>Member</span>
            </div>
          </div>
        </div>

        <QRCodeDisplay 
          name={user?.name}
          email={user?.email}
          qrData={user?.qrCodeData}
        />

        <div className="member-welcome">
          <h2>Welcome to Your Dashboard</h2>
          <p>You have successfully logged in as a member.</p>
          <p>This is your personal member dashboard where you can view your account information.</p>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;

