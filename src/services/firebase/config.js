// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyANAjg4Uj6qriuB2RlgvS7xVFcVSMiR5pI",
    authDomain: "mobifone-ab134.firebaseapp.com",
    projectId: "mobifone-ab134",
    storageBucket: "mobifone-ab134.appspot.com",
    messagingSenderId: "78160048576",
    appId: "1:78160048576:web:fb99b256d219a7d90b5825",
    measurementId: "G-TCV5W92XFQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const contractDB = getStorage(app);


export { contractDB }