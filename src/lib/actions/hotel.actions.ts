'use server';

import type { z } from 'zod';
import type { createHotelSchema } from '@/lib/definitions';
import { adminDb } from '@/lib/firebase-admin';
import { collection, addDoc, getDocs, doc, getDoc } from 'firebase/firestore';


// Function to create a hotel
export async function createHotel(values: z.infer<typeof createHotelSchema>) {
  console.log('Creating hotel with values:', values);
  try {
    const docRef = await adminDb.collection('hotels').add({
      ...values,
      createdAt: new Date(),
    });
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
  try {
    const hotelsCollection = adminDb.collection('hotels');
    const hotelSnapshot = await hotelsCollection.get();
    const hotelsList = hotelSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.hotelName,
            city: data.fullAddress?.split(',')[1]?.trim() || 'N/A',
            country: data.fullAddress?.split(',')[2]?.trim() || 'N/A',
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
    try {
      const hotelDoc = await adminDb.collection('hotels').doc(hotelId).get();
      if (!hotelDoc.exists) {
        throw new Error('Hotel not found');
      }
      const data = hotelDoc.data();
      return {
          id: hotelDoc.id,
          name: data?.hotelName || `Hotel ${hotelId}`,
          address: data?.fullAddress || '123 Fictional Avenue',
          city: data?.fullAddress?.split(',')[1]?.trim() || 'Metropolis',
          country: data?.fullAddress?.split(',')[2]?.trim() || 'USA'
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
