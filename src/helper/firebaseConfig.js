import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCxGiPPhW7YqjnBZqMBK6QXaklCA2RGCdo",
  authDomain: "bby17-a60f8.firebaseapp.com",
  projectId: "bby17-a60f8",
  storageBucket: "bby17-a60f8.firebasestorage.app",
  messagingSenderId: "925713482656",
  appId: "1:925713482656:web:b3efe13e7c97b21f7b5ac5",
  measurementId: "G-4R2X27HQ4Q",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
