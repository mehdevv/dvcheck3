import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Member Management Platform</h1>
        <p>Welcome to the Member Management System</p>
        <div className="home-buttons">
          <Link to="/admin/login" className="home-button admin-button">
            Admin Login
          </Link>
          <Link to="/member/login" className="home-button member-button">
            Member Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;

