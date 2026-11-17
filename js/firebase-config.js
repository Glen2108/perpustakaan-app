// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAbnUYnXLxdcNktnFjthy4Um5Ba4OJrL5g",
  authDomain: "perpustakaanku-sman4.firebaseapp.com",
  projectId: "perpustakaanku-sman4",
  storageBucket: "perpustakaanku-sman4.firebasestorage.app",
  messagingSenderId: "1087005373584",
  appId: "1:1087005373584:web:53b50cfa225f2d7e0b5415",
  measurementId: "G-MC9KE83M70"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);