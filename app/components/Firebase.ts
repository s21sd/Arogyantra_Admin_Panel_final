import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth"
const firebaseConfig = {
    apiKey: "AIzaSyDRADDlCkPQOHDyZeIcJ9nDCfmo94eo7Ig",
    authDomain: "arogyantra-edcea.firebaseapp.com",
    databaseURL: "https://arogyantra-edcea-default-rtdb.firebaseio.com",
    projectId: "arogyantra-edcea",
    storageBucket: "arogyantra-edcea.firebasestorage.app",
    messagingSenderId: "579437407784",
    appId: "1:579437407784:web:5ae972d837502b32774f1d",
    measurementId: "G-XKPQ3N8GXD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);