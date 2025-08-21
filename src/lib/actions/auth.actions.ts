'use server';

import type { z } from 'zod';
import { hotelLoginSchema } from '@/lib/definitions';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// This is a simplified login function. 
// In a production app, use Firebase Auth on the client-side for a full-fledged, secure authentication flow.
export async function loginHotelier(values: z.infer<typeof hotelLoginSchema>) {
  if (!adminDb) {
    return { success: false, message: 'Server configuration error.' };
  }

  try {
    // Check if a hotel owner with this email exists in the database.
    const hotelsRef = adminDb.collection('hotels');
    const snapshot = await hotelsRef.where('ownerEmail', '==', values.email).limit(1).get();

    if (snapshot.empty) {
      return { success: false, message: 'Kein Hotel mit dieser E-Mail-Adresse gefunden.' };
    }

    const hotelDoc = snapshot.docs[0];
    const hotelData = hotelDoc.data();
    const hotelId = hotelDoc.id;

    // --- IMPORTANT ---
    // This is a placeholder for password verification.
    // In a real application, you would NEVER store plaintext passwords.
    // You would use Firebase Authentication to create a user, and then on the client-side,
    // you would use signInWithEmailAndPassword from the Firebase client SDK.
    // The server would then verify the user's ID token.
    // For this prototype, we are skipping the secure password check.
    
    // Simulating successful login
    console.log(`Simulating successful login for ${values.email} for hotel ${hotelId}`);
    
    return { success: true, message: 'Anmeldung erfolgreich!', hotelId: hotelId };

  } catch (error) {
    console.error('Error during hotelier login:', error);
    return { success: false, message: 'Ein unerwarteter Fehler ist aufgetreten.' };
  }
}
