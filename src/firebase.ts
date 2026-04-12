import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9pB1178DkEHHdXwRGoPdLUrZT0SnmcGA",
  authDomain: "quotezap-7c5a3.firebaseapp.com",
  projectId: "quotezap-7c5a3",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);