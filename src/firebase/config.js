import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyADdIiR9_P1TSl9MWb7WEvyBWV5QfSHBtI",
  authDomain: "dvcheck2-e853b.firebaseapp.com",
  projectId: "dvcheck2-e853b",
  storageBucket: "dvcheck2-e853b.firebasestorage.app",
  messagingSenderId: "945070098236",
  appId: "1:945070098236:web:d5705c2bdabb90127e0039"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;

