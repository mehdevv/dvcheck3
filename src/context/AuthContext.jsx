import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  deleteUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  doc, 
  query, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Check if this is the admin user
        if (firebaseUser.email === 'kernoumehdi17@gmail.com') {
          setUser({ 
            email: firebaseUser.email, 
            type: 'admin',
            uid: firebaseUser.uid 
          });
        } else {
          // This is a member - get their data from Firestore
          getMemberData(firebaseUser.uid, firebaseUser.email);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch member data from Firestore
  const getMemberData = async (uid, email) => {
    try {
      const membersRef = collection(db, 'members');
      const q = query(membersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const memberDoc = querySnapshot.docs.find(doc => doc.data().uid === uid);
      if (memberDoc) {
        const memberData = memberDoc.data();
        
        // Generate QR code data if it doesn't exist (for existing members)
        let qrCodeData = memberData.qrCodeData;
        if (!qrCodeData && memberData.name && memberData.email) {
          qrCodeData = JSON.stringify({
            name: memberData.name,
            email: memberData.email,
            type: 'member',
            memberId: uid
          });
          
          // Update Firestore with QR code data
          try {
            await updateDoc(doc(db, 'members', memberDoc.id), {
              qrCodeData: qrCodeData
            });
          } catch (updateError) {
            console.error('Error updating QR code data:', updateError);
          }
        }
        
        setUser({
          email: email,
          name: memberData.name,
          type: 'member',
          id: memberDoc.id,
          uid: uid,
          qrCodeData: qrCodeData || null
        });
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
    }
  };

  // Load members from Firestore (only when authenticated)
  useEffect(() => {
    // Only set up listener if user is authenticated
    if (!auth.currentUser) {
      setMembers([]);
      return;
    }

    const membersRef = collection(db, 'members');
    const q = query(membersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const membersList = [];
        snapshot.forEach((doc) => {
          membersList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setMembers(membersList);
      },
      (error) => {
        console.error('Firestore listener error:', error);
        // If permission denied, it means rules aren't set up yet
        if (error.code === 'permission-denied') {
          console.warn('Firestore permission denied. Please update Firestore security rules.');
          // Store flag to show warning in UI
          localStorage.setItem('firestore_permission_error', 'true');
        }
        setMembers([]);
      }
    );

    return () => unsubscribe();
  }, [user]); // Re-run when user changes

  const login = async (email, password, userType) => {
    try {
      if (userType === 'admin') {
        // Fixed admin credentials
        if (email === 'kernoumehdi17@gmail.com' && password === 'mehdi123') {
          try {
            // Try to sign in with Firebase Auth
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
          } catch (error) {
            // If user doesn't exist, create it
            if (error.code === 'auth/user-not-found') {
              try {
                await createUserWithEmailAndPassword(auth, email, password);
                return { success: true };
              } catch (createError) {
                console.error('Error creating admin user:', createError);
                return { success: false, error: 'Failed to create admin account. Please try again.' };
              }
            }
            throw error;
          }
        }
        return { success: false, error: 'Invalid admin credentials' };
      } else if (userType === 'member') {
        // Member login with Firebase Auth
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true };
      }
      return { success: false, error: 'Invalid user type' };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const addMember = async (memberData) => {
    try {
      // Store current admin email for re-authentication
      const adminEmail = 'kernoumehdi17@gmail.com';
      const adminPassword = 'mehdi123';
      
      // Create Firebase Auth user for the member
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        memberData.email,
        memberData.password
      );
      
      const uid = userCredential.user.uid;

      // Sign out the newly created user immediately
      await firebaseSignOut(auth);
      
      // Re-authenticate as admin BEFORE adding to Firestore
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

      // Generate QR code data (JSON string with name and email)
      const qrCodeData = JSON.stringify({
        name: memberData.name,
        email: memberData.email,
        type: 'member',
        memberId: uid
      });

      // Add member data to Firestore (now authenticated as admin)
      const memberDoc = {
        name: memberData.name,
        email: memberData.email,
        phone: memberData.phone || '',
        password: memberData.password, // Store password in Firestore
        qrCodeData: qrCodeData, // Store QR code data
        uid: uid,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'members'), memberDoc);

      return { id: docRef.id, ...memberDoc };
    } catch (error) {
      console.error('Error adding member:', error);
      let errorMessage = 'Failed to add member. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'A member with this email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      }
      
      // Try to re-authenticate as admin if something went wrong
      try {
        await signInWithEmailAndPassword(auth, 'kernoumehdi17@gmail.com', 'mehdi123');
      } catch (reauthError) {
        console.error('Error re-authenticating admin:', reauthError);
      }
      
      throw new Error(errorMessage);
    }
  };

  const updateMember = async (memberId, updatedData) => {
    try {
      // Get the member to find their UID
      const member = members.find(m => m.id === memberId);
      if (!member) {
        throw new Error('Member not found');
      }

      // Generate updated QR code data
      const qrCodeData = JSON.stringify({
        name: updatedData.name,
        email: updatedData.email,
        type: 'member',
        memberId: member.uid
      });

      // Prepare update data
      const updateData = {
        name: updatedData.name,
        email: updatedData.email,
        phone: updatedData.phone || '',
        qrCodeData: qrCodeData, // Update QR code data
        updatedAt: new Date().toISOString(),
      };

      // If password is being updated, store it in Firestore
      // Note: To update Firebase Auth password, you need Admin SDK
      // For now, we'll update Firestore and the member can use the new password on next login
      if (updatedData.password && updatedData.password.trim() !== '') {
        updateData.password = updatedData.password;
        
        // Try to update Firebase Auth password if we have the old password
        // This is a workaround - in production, use Admin SDK
        if (member.uid && member.password) {
          try {
            const adminEmail = 'kernoumehdi17@gmail.com';
            const adminPassword = 'mehdi123';
            
            // Sign in as the member temporarily using stored password
            await signInWithEmailAndPassword(auth, member.email, member.password);
            // Update password in Firebase Auth
            if (auth.currentUser) {
              await updatePassword(auth.currentUser, updatedData.password);
            }
            // Sign back out
            await firebaseSignOut(auth);
            // Re-authenticate as admin
            await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
          } catch (authError) {
            console.warn('Could not update Firebase Auth password. Firestore password updated. Member may need to use password reset.', authError);
            // Continue with Firestore update even if Auth update fails
          }
        }
      }

      // Update Firestore document
      await updateDoc(doc(db, 'members', memberId), updateData);

      return { success: true };
    } catch (error) {
      console.error('Error updating member:', error);
      throw new Error(error.message || 'Failed to update member. Please try again.');
    }
  };

  const deleteMember = async (memberId) => {
    try {
      const adminEmail = 'kernoumehdi17@gmail.com';
      const adminPassword = 'mehdi123';
      
      // Get member data to find the UID and password
      const member = members.find(m => m.id === memberId);
      
      if (!member) {
        throw new Error('Member not found');
      }

      // Delete from Firestore first
      await deleteDoc(doc(db, 'members', memberId));

      // Delete from Firebase Auth if we have the member's credentials
      if (member.uid && member.email && member.password) {
        try {
          // Sign in as the member temporarily to delete their Auth account
          await signInWithEmailAndPassword(auth, member.email, member.password);
          
          // Delete the Auth user account
          if (auth.currentUser) {
            await deleteUser(auth.currentUser);
          }
          
          // Sign back out (should already be signed out after deleteUser, but just in case)
          await firebaseSignOut(auth);
          
          // Re-authenticate as admin
          await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        } catch (authError) {
          console.error('Error deleting Firebase Auth user:', authError);
          // If Auth deletion fails, we've already deleted from Firestore
          // Try to re-authenticate as admin anyway
          try {
            await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
          } catch (reauthError) {
            console.error('Error re-authenticating admin:', reauthError);
          }
          // Don't throw error - Firestore deletion succeeded
          // Just log a warning
          console.warn('Member deleted from Firestore but Auth user deletion failed. The user may still be able to log in.');
        }
      } else {
        // If we don't have password, we can't delete from Auth
        // This is okay - at least we deleted from Firestore
        console.warn('Member deleted from Firestore. Could not delete from Auth (password not available).');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      
      // Try to re-authenticate as admin if something went wrong
      try {
        await signInWithEmailAndPassword(auth, 'kernoumehdi17@gmail.com', 'mehdi123');
      } catch (reauthError) {
        console.error('Error re-authenticating admin:', reauthError);
      }
      
      throw new Error(error.message || 'Failed to delete member. Please try again.');
    }
  };

  const value = {
    user,
    members,
    loading,
    login,
    logout,
    addMember,
    updateMember,
    deleteMember,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
