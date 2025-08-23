// src/lib/firebase-admin.ts
import admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  try {
    // When deployed to App Hosting, the SDK will automatically
    // discover the service account credentials.
    // For local development, you would set the GOOGLE_APPLICATION_CREDENTIALS
    // environment variable to point to your service account key file.
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

let adminAuth, adminDb, adminStorage;

try {
  adminAuth = admin.auth();
  adminDb = admin.firestore();
  adminStorage = admin.storage();
} catch (error) {
    console.error('Error getting Firebase services from admin SDK', error);
}


export { adminAuth, adminDb, adminStorage };
