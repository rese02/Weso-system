// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import type {Auth} from 'firebase-admin/auth';
import type {Firestore} from 'firebase-admin/firestore';
import type {Storage} from 'firebase-admin/storage';

interface FirebaseAdmin {
  auth: Auth;
  db: Firestore;
  storage: Storage;
}

// Global cache for the admin instance to avoid re-initialization
let adminInstance: FirebaseAdmin | null = null;

function initializeFirebaseAdmin(): FirebaseAdmin {
  if (admin.apps.length === 0) {
    try {
      console.log('Initializing Firebase Admin SDK...');
      // initializeApp() ohne Argumente funktioniert in Google-Cloud-Umgebungen (wie Firebase),
      // da die Credentials automatisch erkannt werden (Application Default Credentials).
      admin.initializeApp();
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
      console.error('Firebase admin initialization error', error);
      // Re-throw the error to be caught by the caller
      throw new Error('Failed to initialize Firebase Admin SDK.');
    }
  }

  return {
    auth: admin.auth(),
    db: admin.firestore(),
    storage: admin.storage(),
  };
}

export function getFirebaseAdmin(): FirebaseAdmin {
  if (!adminInstance) {
    adminInstance = initializeFirebaseAdmin();
  }
  return adminInstance;
}
