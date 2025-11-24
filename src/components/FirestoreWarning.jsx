import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const FirestoreWarning = () => {
  const { user, members } = useAuth();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Show warning if user is logged in but can't access members
    if (user && user.type === 'admin' && members.length === 0) {
      // Check if it's a permission issue by trying to detect it
      const hasPermissionError = localStorage.getItem('firestore_permission_error');
      if (hasPermissionError) {
        setShowWarning(true);
      }
    }
  }, [user, members]);

  if (!showWarning) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(255, 59, 48, 0.95)',
      backdropFilter: 'blur(10px)',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      zIndex: 10000,
      maxWidth: '600px',
      textAlign: 'center'
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
        ⚠️ Firestore Permission Error
      </h3>
      <p style={{ margin: '0 0 12px 0', fontSize: '14px', opacity: 0.9 }}>
        You need to update Firestore security rules in Firebase Console.
      </p>
      <div style={{ fontSize: '12px', marginBottom: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontFamily: 'monospace' }}>
        <div style={{ marginBottom: '4px' }}>1. Go to: console.firebase.google.com</div>
        <div style={{ marginBottom: '4px' }}>2. Select project: dvcheck-4ec16</div>
        <div style={{ marginBottom: '4px' }}>3. Firestore Database → Rules tab</div>
        <div>4. Paste rules (see FIREBASE_RULES_COPY_PASTE.txt)</div>
      </div>
      <button
        onClick={() => {
          setShowWarning(false);
          localStorage.removeItem('firestore_permission_error');
        }}
        style={{
          background: 'white',
          color: '#FF3B30',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '14px'
        }}
      >
        Got it, I'll update the rules
      </button>
    </div>
  );
};

export default FirestoreWarning;

