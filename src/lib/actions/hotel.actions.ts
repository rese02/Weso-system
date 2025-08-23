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
  // --- TEMPORARY TEST DATA ---
  const testHotel = {
      id: 'hotel-sonnenalp',
      name: 'Hotel Sonnenalp',
      domain: 'hotel-sonnenalp.de',
      bookings: 128,
      status: 'active'
  };
  // In a real scenario, you'd fetch this from Firestore and remove the test data.
  // return [testHotel, ...firestoreHotels];
  return [testHotel];
}


// Placeholder to get a single hotel's data
export async function getHotelById(hotelId: string) {
    console.log(`Fetching hotel ${hotelId}...`);
    
    if (hotelId === 'hotel-sonnenalp') {
        return {
            id: 'hotel-sonnenalp',
            name: 'Hotel Sonnenalp',
            address: 'Bergweg 10, 6020 Alpenstadt',
            city: 'Alpenstadt',
            country: 'Österreich'
        }
    }

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

// Placeholder to get the dashboard data for a hotel
export async function getHotelDashboardData(hotelId: string) {
    console.log(`Fetching dashboard data for hotel ${hotelId}...`);
    // In a real app, this would fetch real data from Firestore
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        hotelName: "Hotel Sonnenalp",
        stats: {
            totalRevenue: "125.450,89",
            totalBookings: 152,
            confirmedBookings: 141,
            pendingActions: 3,
        },
        recentActivities: [
            { id: "BPXMTR", description: "Buchung für Nawaf Safar wurde zuletzt aktualisiert. Status: Confirmed", timestamp: "vor 5 Min." },
            { id: "RVBEMD", description: "Buchung für Daniela Varnero wurde zuletzt aktualisiert. Status: Confirmed", timestamp: "vor 1 Std." },
            { id: "BBZGVD", description: "Buchung für Khalid AlKhozai wurde zuletzt aktualisiert. Status: Confirmed", timestamp: "vor 3 Std." },
             { id: "XYZABC", description: "Neue Buchung von Max Mustermann erstellt.", timestamp: "vor 5 Std." },
        ]
    }
}
