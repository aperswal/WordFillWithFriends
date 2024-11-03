import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup as firebaseSignIn } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBaOe404flFQIvW1A9hwnQiY1mNhKI7Snk",
  authDomain: "wordfill-e0626.firebaseapp.com",
  projectId: "wordfill-e0626",
  storageBucket: "wordfill-e0626.firebasestorage.app",
  messagingSenderId: "377650459543",
  appId: "1:377650459543:web:91003b7f0fe16e8209cad2",
  measurementId: "G-MT008WLZHW"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const signInWithPopup = firebaseSignIn;