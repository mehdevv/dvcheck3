import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB8u4N_VYJocJX0nK4m2ONGF0c_Mq2jntY",
  authDomain: "dvcheck-4ec16.firebaseapp.com",
  projectId: "dvcheck-4ec16",
  storageBucket: "dvcheck-4ec16.firebasestorage.app",
  messagingSenderId: "122762821054",
  appId: "1:122762821054:web:c2db684d31ae9ef9c60def"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;

