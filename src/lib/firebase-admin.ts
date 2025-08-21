// src/lib/firebase-admin.ts
import admin from 'firebase-admin';

// This is a placeholder for your service account credentials.
// In a real application, you would load this from a secure location (e.g., environment variables).
const serviceAccount = {
  // Your service account key here
  // "type": "service_account",
  // "project_id": "...",
  // ...
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

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
