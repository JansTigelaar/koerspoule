// src/firebase/config.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Firebase configuratie
// VERVANG DEZE WAARDEN MET JE EIGEN FIREBASE PROJECT CREDENTIALS
const firebaseConfig = {
  apiKey: "AIzaSyBkUqG_OmYKHQKTkJvO6Wv57shfz4jn-Uk",
  authDomain: "koerspoule-5d3bc.firebaseapp.com",
  projectId: "koerspoule-5d3bc",
  storageBucket: "koerspoule-5d3bc.firebasestorage.app",
  messagingSenderId: "307385914400",
  appId: "1:307385914400:web:df5ebb69f13d73f3fa9845",
  measurementId: "G-7N484DHQWD"
};

// Firebase initialiseren
const app = initializeApp(firebaseConfig);

// Auth, Firestore en Functions instanties exporteren
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

/*
SETUP INSTRUCTIES:
1. Ga naar https://console.firebase.google.com/
2. Maak een nieuw project aan (of gebruik bestaand project)
3. Activeer Authentication > Email/Password
4. Activeer Firestore Database
5. Kopieer je config waarden van Project Settings > General
6. Vervang de waarden hierboven

FIRESTORE SECURITY RULES (voeg toe in Firebase Console):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users kunnen alleen hun eigen user document lezen/schrijven
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Events kunnen door iedereen gelezen worden, alleen admins kunnen schrijven
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Teams kunnen gelezen worden door iedereen, maar alleen de eigenaar kan schrijven
    match /teams/{teamId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
    }
    
    // Scores kunnen door iedereen gelezen worden, alleen admins kunnen schrijven
    match /scores/{scoreId} {
      allow read: if true;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
*/
