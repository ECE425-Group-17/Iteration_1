// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB36ldReK1HZOgP8lq8GSBVtxEj_o0zk_w",
  authDomain: "iteration1-5ccac.firebaseapp.com",
  projectId: "iteration1-5ccac",
  storageBucket: "iteration1-5ccac.firebasestorage.app",
  messagingSenderId: "124220947349",
  appId: "1:124220947349:web:3a83b02fff099ddafad49c",
  measurementId: "G-4F1K3NDF3B"
};

const app = initializeApp(firebaseConfig);

// Export services your app uses
export const auth = getAuth(app);
export const db = getFirestore(app);