
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
      console.log(`Login failed: No hotel found with email ${values.email}`);
      return { success: false, message: 'Invalid credentials.' };
    }

    const hotelDoc = snapshot.docs[0];
    const hotelData = hotelDoc.data();

    // SECURITY-HINWEIS: In einer Produktionsanwendung sollten Passwörter niemals im Klartext gespeichert oder verglichen werden.
    // Verwenden Sie stattdessen eine sichere Hashing-Bibliothek wie bcrypt, um die Passwörter zu hashen und zu vergleichen.
    if (hotelData.hotelierPassword === values.password) {
      console.log(`Login successful for hotel ${hotelDoc.id}`);
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
  console.log('Attempting agency login for:', values.email);

  // Anmeldedaten werden sicher aus Umgebungsvariablen gelesen.
  const agencyEmail = process.env.AGENCY_EMAIL;
  const agencyPassword = process.env.AGENCY_PASSWORD;

  if (!agencyEmail || !agencyPassword) {
    console.error("Agency credentials are not set in environment variables.");
    return { success: false, message: 'Server configuration error.' };
  }
  
  if (values.email === agencyEmail && values.password === agencyPassword) {
    console.log('Agency login successful.');
    return { success: true, message: 'Login successful!' };
  }

  console.log('Agency login failed: Invalid credentials.');
  return { success: false, message: 'Invalid credentials or not an agency account.' };
}
