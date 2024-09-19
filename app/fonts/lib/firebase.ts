import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyChRQjk5jAOSZw_91SWmOqiTqaBJkmRnvo",
    authDomain: "calapp-version-brice.firebaseapp.com",
    projectId: "calapp-version-brice",
    storageBucket: "calapp-version-brice.appspot.com",
    messagingSenderId: "215815848210",
    appId: "1:215815848210:web:c55f4e199b170f72bbb3cb"
};

const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

console.log("Firebase App initialized:", app);
console.log("Firebase Auth instance:", auth);
console.log("Firebase Firestore instance:", db);

export { auth, db, app };
