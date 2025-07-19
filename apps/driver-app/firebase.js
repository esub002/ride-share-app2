// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdqB3ZewnxLnHAo72UeGFvqSqn_MC379c",
  authDomain: "ride-a242f.firebaseapp.com",
  projectId: "ride-a242f",
  storageBucket: "ride-a242f.firebasestorage.app",
  messagingSenderId: "1015416753948",
  appId: "1:1015416753948:android:f723f6340c1c23f20a34d9"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };