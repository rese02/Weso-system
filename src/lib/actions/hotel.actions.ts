'use server';

import type { z } from 'zod';
import type { createHotelSchema } from '@/lib/definitions';
import { db } from '@/lib/firebase.client';
import { collection, addDoc, getDocs } from 'firebase/firestore';


// Function to create a hotel
export async function createHotel(values: z.infer<typeof createHotelSchema>) {
  console.log('Creating hotel with values:', values);
  try {
    const hotelsCollection = collection(db, 'hotels');
    const docRef = await addDoc(hotelsCollection, {
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
    const hotelsCollection = collection(db, 'hotels');
    const hotelSnapshot = await getDocs(hotelsCollection);
    const hotelsList = hotelSnapshot.docs.map(doc => ({
        id: doc.id,
        // @ts-ignore
        name: doc.data().hotelName,
        // @ts-ignore
        city: doc.data().fullAddress?.split(',')[1]?.trim() || 'N/A',
        // @ts-ignore
        country: doc.data().fullAddress?.split(',')[2]?.trim() || 'N/A',
        bookings: Math.floor(Math.random() * 200) // Placeholder
    }));
    return hotelsList;
  } catch (error) {
      console.error("Error fetching hotels: ", error);
      return [];
  }
}

// Placeholder to get a single hotel's data
export async function getHotelById(hotelId: string) {
    console.log(`Fetching hotel ${hotelId}...`);
    // In a real app, you'd fetch from Firestore by doc ID
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
        id: hotelId,
        name: `Hotel ${hotelId.replace('-', ' ')}`,
        address: '123 Fictional Avenue',
        city: 'Metropolis',
        country: 'USA'
    }
}
