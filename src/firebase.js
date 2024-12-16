import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyA05ItawNAXv8UxqodoFJ33mtgSy0tNDQY",
    authDomain: "personal-website-4ace7.firebaseapp.com",
    projectId: "personal-website-4ace7",
    storageBucket: "personal-website-4ace7.firebasestorage.app",
    messagingSenderId: "356596528161",
    appId: "1:356596528161:web:1a6d4c03630a86f5db5f60",
    measurementId: "G-T2G525T56N"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics only if it's supported (not in development/localhost)
export const analytics = (async () => {
    if (await isSupported()) {
        return getAnalytics(app);
    }
    return null;
})();