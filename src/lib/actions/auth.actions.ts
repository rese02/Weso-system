'use server';

import type { z } from 'zod';
import { hotelLoginSchema, agencyLoginSchema } from '@/lib/definitions';

// This is a simplified login function. 
// In a production app, you would use Firebase Auth on the client-side for a full-fledged, secure authentication flow.
// The server would then verify the user's ID token.
export async function loginHotelier(values: z.infer<typeof hotelLoginSchema>) {
  console.log('Attempting hotelier login for:', values.email);

  // In a real app, you would verify credentials against Firebase Auth.
  // For this prototype, we use a hardcoded credential for demonstration.
  if (values.email === 'manager@hotel-sonnenalp.com' && values.password === 'password123') {
    return { success: true, message: 'Login successful!', hotelId: 'hotel-sonnenalp' };
  }
  
  return { success: false, message: 'Invalid credentials. Please check your email and password.' };
}


export async function loginAgency(values: z.infer<typeof agencyLoginSchema>) {
  console.log('Attempting agency login for:', values.email);

  // In a real app, you would verify credentials against Firebase Auth and check for an "agency" custom claim.
  // For this prototype, we use a hardcoded credential for demonstration.
  if (values.email === 'admin@weso.com' && values.password === 'password123') {
    return { success: true, message: 'Login successful!' };
  }

  return { success: false, message: 'Invalid credentials or not an agency account.' };
}
