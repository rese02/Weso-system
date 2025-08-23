
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
      // This robust initialization method is recommended for server environments.
      // It attempts to use service account credentials from an environment variable first,
      // which is ideal for production/staging environments.
      // If that's not available, it falls back to Application Default Credentials (ADC),
      // which is perfect for local development with `gcloud auth application-default login`
      // or for Google Cloud managed environments (Cloud Run, Cloud Functions).
      const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
        ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
        : undefined;

      admin.initializeApp({
          credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
      console.error('Firebase admin initialization error:', error);
      // Re-throw the error to be caught by the caller
      throw new Error('Failed to initialize Firebase Admin SDK. Ensure GOOGLE_APPLICATION_CREDENTIALS_JSON is set or Application Default Credentials are configured.');
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
