import {createContext} from "react";
import { initializeApp } from "firebase/app";
import {getAuth } from "firebase/auth";

import {getFirestore,doc,setDoc}  from "firebase/firestore"


const firebaseConfig = {
  apiKey: "AIzaSyBx4Dy8gVAIj9B7vqOVHUyS1lTm1YgSqHA",
  authDomain: "esg-project-218d6.firebaseapp.com",
  projectId: "esg-project-218d6",
  storageBucket: "esg-project-218d6.firebasestorage.app",
  messagingSenderId: "858366707779",
  appId: "1:858366707779:web:5e704e2159d0559f756cf6",
  measurementId: "G-91W2VQXT0Q"
};


const firebaseApp = initializeApp(firebaseConfig);
const FirebaseContext=createContext(null);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export const FirebaseProvider=({children})=>{
  return(
    <FirebaseContext.Provider value={{auth,db}}>
      {children}
      </FirebaseContext.Provider>
  )
}
