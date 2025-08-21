// src/lib/firebase-admin.ts
import admin from 'firebase-admin';

// Ensure you have set these environment variables
const serviceAccount = {
  type: process.env.FIREBASE_ADMIN_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
  auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
  token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
};

const isConfigured = serviceAccount.project_id && serviceAccount.private_key && serviceAccount.client_email;

if (isConfigured && !admin.apps.length) {
  try {
    admin.initializeApp({
      // @ts-ignore
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

let adminAuth: admin.auth.Auth | undefined;
let adminDb: admin.firestore.Firestore | undefined;
let adminStorage: admin.storage.Storage | undefined;

if (admin.apps.length > 0) {
    adminAuth = admin.auth();
    adminDb = admin.firestore();
    adminStorage = admin.storage();
}


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
