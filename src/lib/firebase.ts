      // Import the functions you need from the SDKs you need
      import { initializeApp } from "firebase/app";
      import { getFirestore } from "firebase/firestore";
      // TODO: Add SDKs for Firebase products that you want to use
      // https://firebase.google.com/docs/web/setup#available-libraries
      
      // Your web app's Firebase configuration
      const firebaseConfig = {
        apiKey: "AIzaSyDLAqY4ON29pDWHuor8HiTYnxTY-Ekr_bc",
        authDomain: "bestcarevents-dev.firebaseapp.com",
        projectId: "bestcarevents-dev",
        storageBucket: "bestcarevents-dev.firebasestorage.app",
        messagingSenderId: "653477912519",
        appId: "1:653477912519:web:77ef3c7b6617883efe03e2",
        measurementId: "G-5ZGKP6TS4C"
      };
      
      // Initialize Firebase
      export const app = initializeApp(firebaseConfig);
      export const db = getFirestore(app);