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

const adminAuth = admin.auth();
const adminDb = admin.firestore();
const adminStorage = admin.storage();

export { adminAuth, adminDb, adminStorage };

/**
 * Verifies the session cookie. This is a placeholder function.
 * In a real application, this would verify the cookie from the request headers.
 * @param session - The session cookie string.
 * @returns A promise that resolves with the decoded token or throws an error.
 */
export const verifyAuth = async (session: string | null | undefined) => {
  if (!session) {
    throw new Error('No session cookie provided.');
  }
  // In a real app, you'd use admin.auth().verifySessionCookie(session, true);
  // For this placeholder, we'll simulate a successful verification.
  if (session === 'agency_session_cookie') {
    return { uid: 'agency-user-id', role: 'agency' };
  }
  if (session.startsWith('hotelier_session_cookie_')) {
    const hotelId = session.split('_').pop();
    return { uid: 'hotelier-user-id', role: 'hotelier', hotelId };
  }
  throw new Error('Invalid session cookie.');
};
