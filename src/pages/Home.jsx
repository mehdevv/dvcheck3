import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShield, FiUser } from 'react-icons/fi';
import './Home.css';

const MotionDiv = motion.div;

const Home = () => {
  return (
    <div className="home-page">
      <div className="home-background" />
      
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="home-content">
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ marginBottom: 'var(--spacing-lg)' }}
            >
              <img 
                src="/DVscan.png" 
                alt="DVcheck Logo" 
                className="home-logo"
              />
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ marginBottom: 'var(--spacing-2xl)' }}
            >
              <p className="home-tagline">
                from Digital valley for Digital valley
              </p>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="home-buttons"
            >
              <Link to="/admin/login" className="btn btn-primary home-button">
                <FiShield size={20} />
                Admin Login
              </Link>
              
              <Link to="/member/login" className="btn btn-ghost home-button">
                <FiUser size={20} />
                Member Login
              </Link>
            </MotionDiv>
          </div>
        </MotionDiv>
      </div>
    </div>
  );
};

export default Home;
