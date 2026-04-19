import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBma9Y2VbRkLn2f1IEHNeodG3dMnr5dLDw",
  authDomain: "lumen-vpromptwars.firebaseapp.com",
  projectId: "lumen-vpromptwars",
  storageBucket: "lumen-vpromptwars.firebasestorage.app",
  messagingSenderId: "610874554917",
  appId: "1:610874554917:web:89e62a17048effda8eddcc"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, storage, googleProvider };
