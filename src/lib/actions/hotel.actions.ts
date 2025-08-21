'use server';

import 'dotenv/config'; // Load environment variables
import type { z } from 'zod';
import type { createHotelSchema } from '@/lib/definitions';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Function to create a hotel
export async function createHotel(values: z.infer<typeof createHotelSchema>) {
  console.log('Creating hotel with values:', values);
  if (!adminDb) {
    console.error("Firestore not initialized. Check Firebase Admin SDK credentials.");
    return { success: false, message: 'Failed to create hotel due to server misconfiguration.' };
  }
  try {
    // We map the form values to the desired database structure
    const hotelData = {
      agencyId: "agency_weso_systems", // Placeholder, this would come from the logged in user
      name: values.hotelName,
      domain: values.domain || '',
      logoUrl: '', // This will be updated after file upload
      ownerEmail: values.hotelierEmail,
      // ownerPassword is for authentication, not for storing in Firestore in plaintext.
      // A user account should be created via Firebase Auth instead. We'll skip storing it.
      ownerUid: '', // This would be the Firebase Auth UID of the hotelier
      
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
      contactAddress: values.fullAddress,
      
      boardTypes: values.meals,
      roomCategories: values.roomCategories.map(c => c.name),
      
      bankAccountHolder: values.bankAccountHolder,
      bankIBAN: values.iban,
      bankBIC: values.bic,
      bankName: values.bankName,
      
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('hotels').add(hotelData);
    
    console.log("Document written with ID: ", docRef.id);
    return { success: true, message: 'Hotel created successfully!', hotelId: docRef.id };
  } catch (e) {
    console.error("Error adding document: ", e);
    return { success: false, message: 'Failed to create hotel.' };
  }
}

// Function to fetch all hotels for the agency
export async function getHotels() {
  console.log('Fetching all hotels...');
  if (!adminDb) {
    console.error("Firestore not initialized. Check Firebase Admin SDK credentials.");
    return [];
  }
  try {
    const hotelsCollection = adminDb.collection('hotels');
    const hotelSnapshot = await hotelsCollection.get();
    const hotelsList = hotelSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name, // updated from hotelName
            city: data.contactAddress?.split(',')[1]?.trim() || 'N/A',
            country: data.contactAddress?.split(',')[2]?.trim() || 'N/A',
            bookings: Math.floor(Math.random() * 200) // Placeholder
        }
    });
    return hotelsList;
  } catch (error) {
      console.error("Error fetching hotels: ", error);
      return [];
  }
}

// Placeholder to get a single hotel's data
export async function getHotelById(hotelId: string) {
    console.log(`Fetching hotel ${hotelId}...`);
    if (!adminDb) {
        console.error("Firestore not initialized. Check Firebase Admin SDK credentials.");
        return {
            id: hotelId,
            name: `Hotel ${hotelId}`,
            address: '123 Fictional Avenue',
            city: 'Metropolis',
            country: 'USA'
       };
    }
    try {
      const hotelDoc = await adminDb.collection('hotels').doc(hotelId).get();
      if (!hotelDoc.exists) {
        throw new Error('Hotel not found');
      }
      const data = hotelDoc.data();
      return {
          id: hotelDoc.id,
          name: data?.name || `Hotel ${hotelId}`,
          address: data?.contactAddress || '123 Fictional Avenue',
          city: data?.contactAddress?.split(',')[1]?.trim() || 'Metropolis',
          country: data?.contactAddress?.split(',')[2]?.trim() || 'USA'
      }
    } catch (error) {
       console.error("Error fetching hotel by ID: ", error);
       // Return a default object in case of error to avoid breaking the layout
       return {
            id: hotelId,
            name: `Hotel ${hotelId}`,
            address: '123 Fictional Avenue',
            city: 'Metropolis',
            country: 'USA'
       }
    }
}
