import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForPrototype",
  authDomain: "spinflow-app.firebaseapp.com",
  projectId: "spinflow-app",
  storageBucket: "spinflow-app.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:dummyid"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };