'use server';

import type { z } from 'zod';
import { hotelLoginSchema, agencyLoginSchema } from '@/lib/definitions';
import { getFirebaseAdmin } from '@/lib/firebase-admin';


export async function loginHotelier(values: z.infer<typeof hotelLoginSchema>) {
  console.log('Attempting hotelier login for:', values.email);
  const { db } = getFirebaseAdmin();

  try {
    const hotelsRef = db.collection('hotels');
    const snapshot = await hotelsRef.where('hotelierEmail', '==', values.email).limit(1).get();

    if (snapshot.empty) {
      return { success: false, message: 'Invalid credentials.' };
    }

    const hotelDoc = snapshot.docs[0];
    const hotelData = hotelDoc.data();

    // In a real app, passwords should be hashed and compared securely.
    // This is a plain text comparison for demonstration purposes.
    if (hotelData.hotelierPassword === values.password) {
      return { success: true, message: 'Login successful!', hotelId: hotelDoc.id };
    } else {
      return { success: false, message: 'Invalid credentials.' };
    }

  } catch (error) {
    console.error("Error logging in hotelier: ", error);
    return { success: false, message: 'An internal server error occurred.' };
  }
}


export async function loginAgency(values: z.infer<typeof agencyLoginSchema>) {
  console.log('Attempting agency login for:', values.email);

  // This simulates checking for a user with an "agency" role claim.
  // This part remains hardcoded as there's no "agency" data model yet.
  if (values.email === 'admin@weso.com' && values.password === 'password123') {
    return { success: true, message: 'Login successful!' };
  }

  return { success: false, message: 'Invalid credentials or not an agency account.' };
}
