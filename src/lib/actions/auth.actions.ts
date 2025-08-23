'use server';

import type { z } from 'zod';
import { hotelLoginSchema, agencyLoginSchema } from '@/lib/definitions';
import { adminAuth } from '@/lib/firebase-admin';

// This is a placeholder for a real authentication flow.
// In a production app, you would use the Firebase Client SDK to sign the user in,
// then get their ID token and send it to a server-side function to verify
// and check for custom claims.

export async function loginHotelier(values: z.infer<typeof hotelLoginSchema>) {
  console.log('Attempting hotelier login for:', values.email);

  // In a real app, you would verify credentials against Firebase Auth.
  // This simulation checks for a specific user and returns their associated hotelId.
  if (values.email === 'manager@hotel-sonnenalp.com' && values.password === 'password123') {
    // In a real scenario, you'd verify the user's token and get the hotelId from custom claims.
    return { success: true, message: 'Login successful!', hotelId: 'hotel-sonnenalp' };
  }
  
  // Example for another hotel
  if (values.email === 'manager@seehotel-traum.de' && values.password === 'password123') {
    return { success: true, message: 'Login successful!', hotelId: 'seehotel-traum' };
  }

  return { success: false, message: 'Invalid credentials. Please check your email and password.' };
}


export async function loginAgency(values: z.infer<typeof agencyLoginSchema>) {
  console.log('Attempting agency login for:', values.email);

  // This simulates checking for a user with an "agency" role claim.
  if (values.email === 'admin@weso.com' && values.password === 'password123') {
    return { success: true, message: 'Login successful!' };
  }

  return { success: false, message: 'Invalid credentials or not an agency account.' };
}
