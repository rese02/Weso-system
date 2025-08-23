
'use server';

import type { z } from 'zod';
import { hotelLoginSchema, agencyLoginSchema } from '@/lib/definitions';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth as clientAuth } from '@/lib/firebase.client';


export async function loginHotelier(values: z.infer<typeof hotelLoginSchema>) {
  console.log('Attempting hotelier login for:', values.email);
  const { db } = getFirebaseAdmin();

  try {
    const hotelsRef = db.collection('hotels');
    const snapshot = await hotelsRef.where('hotelierEmail', '==', values.email).limit(1).get();

    if (snapshot.empty) {
      console.log(`Login failed: No hotel found with email ${values.email}`);
      return { success: false, message: 'Invalid credentials.' };
    }

    const hotelDoc = snapshot.docs[0];
    const hotelData = hotelDoc.data();

    // SECURITY NOTICE: In a real production app, passwords should never be stored in plaintext.
    // Use a secure hashing library like bcrypt for comparison. This is for demonstration only.
    if (hotelData.hotelierPassword === values.password) {
      console.log(`Login successful for hotel ${hotelDoc.id}`);
      // In a real app, you would generate a session cookie here after client-side sign-in
      return { success: true, message: 'Login successful!', hotelId: hotelDoc.id };
    } else {
      console.log(`Login failed: Password mismatch for hotel ${hotelDoc.id}`);
      return { success: false, message: 'Invalid credentials.' };
    }

  } catch (error) {
    console.error("Error logging in hotelier: ", error);
    return { success: false, message: 'An internal server error occurred.' };
  }
}


export async function loginAgency(values: z.infer<typeof agencyLoginSchema>) {
  console.log('Attempting agency login via Firebase Auth for:', values.email);
  
  try {
    // We use the client auth SDK here to sign the user in, 
    // then in a real app, we would create a session cookie from the server.
    // This is a simplified flow for demonstration.
    const userCredential = await signInWithEmailAndPassword(clientAuth, values.email, values.password);
    const user = userCredential.user;

    if (user) {
      // In a real app, you'd verify custom claims on the server to ensure role is 'agency'
      console.log('Agency login successful via Firebase Auth.');
      return { success: true, message: 'Login successful!' };
    }
    return { success: false, message: 'An unknown error occurred.' };

  } catch (error: any) {
    console.error("Firebase agency login error: ", error.code);
    let message = 'An unknown error occurred.';
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        message = 'Invalid email or password.';
        break;
      case 'auth/too-many-requests':
        message = 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.';
        break;
      default:
        message = 'Login failed. Please try again later.';
    }
    return { success: false, message };
  }
}

export async function sendAgencyPasswordResetEmail(email: string) {
    const { auth } = getFirebaseAdmin();
    try {
        await auth.generatePasswordResetLink(email);
        // In a real app, you would use this link to send an email via a service like SendGrid.
        // For this demo, we assume Firebase sends the email directly if configured.
        console.log(`Password reset email generation attempted for ${email}. In a real app, an email would be sent.`);
        return { success: true, message: 'If an account exists for this email, a password reset link has been sent.' };
    } catch (error: any) {
        console.error('Error generating password reset link:', error);
        // Return a generic message to avoid user enumeration attacks
        return { success: true, message: 'If an account exists for this email, a password reset link has been sent.' };
    }
}
