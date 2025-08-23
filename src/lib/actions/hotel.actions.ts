'use server';

import 'dotenv/config';
import type { z } from 'zod';
import type { createHotelSchema, Hotel } from '@/lib/definitions';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

/**
 * Creates a new hotel in Firestore.
 * This function takes the validated form data and creates a new document
 * in the 'hotels' collection. It also adds the domain to a 'domains'
 * collection to ensure uniqueness.
 */
export async function createHotel(values: z.infer<typeof createHotelSchema>) {
  const { db } = getFirebaseAdmin();
  const hotelRef = db.collection('hotels').doc();
  const domainRef = db.collection('domains').doc(values.domain as string);

  try {
    // Check if the domain is already taken
    const domainDoc = await domainRef.get();
    if (domainDoc.exists) {
      return { success: false, message: 'This domain is already taken.' };
    }

    const hotelData = {
      id: hotelRef.id,
      name: values.hotelName,
      domain: values.domain,
      hotelierEmail: values.hotelierEmail,
      hotelierPassword: values.hotelierPassword, // IMPORTANT: In production, this should be hashed.
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
      address: values.fullAddress,
      roomCategories: values.roomCategories,
      meals: values.meals,
      bankDetails: {
        accountHolder: values.bankAccountHolder,
        bankName: values.bankName,
        iban: values.iban,
        bic: values.bic,
      },
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
    };

    // Use a batch write to ensure atomicity
    const batch = db.batch();
    batch.set(hotelRef, hotelData);
    batch.set(domainRef, { hotelId: hotelRef.id });

    await batch.commit();

    return { success: true, message: 'Hotel created successfully!', hotelId: hotelRef.id };
  } catch (error) {
    console.error("Error creating hotel: ", error);
    // @ts-ignore
    return { success: false, message: error.message || 'Failed to create hotel.' };
  }
}

// Function to fetch all hotels for the agency
export async function getHotels() {
    const { db } = getFirebaseAdmin();
    try {
        const hotelsSnapshot = await db.collection('hotels').orderBy('createdAt', 'desc').get();
        if (hotelsSnapshot.empty) {
            return [];
        }
        
        const hotels = await Promise.all(hotelsSnapshot.docs.map(async (doc) => {
            const hotelData = doc.data();
            const bookingsSnapshot = await db.collection('hotels').doc(doc.id).collection('bookings').get();
            return {
                id: doc.id,
                name: hotelData.name,
                domain: hotelData.domain,
                bookings: bookingsSnapshot.size, // Get the count of bookings
                status: hotelData.status || 'inactive',
            };
        }));
        
        return hotels;

    } catch (error) {
        console.error("Error fetching hotels:", error);
        return [];
    }
}

// Get a single hotel's data by its ID
export async function getHotelById(hotelId: string): Promise<Hotel | null> {
    const { db } = getFirebaseAdmin();
    try {
        const hotelDoc = await db.collection('hotels').doc(hotelId).get();
        if (!hotelDoc.exists) {
            console.warn(`Hotel with id ${hotelId} not found.`);
            return null;
        }
        return hotelDoc.data() as Hotel;
    } catch (error) {
        console.error(`Error fetching hotel ${hotelId}:`, error);
        return null;
    }
}

// Helper function to convert Firestore Timestamps to JS Dates in nested objects
function convertTimestampsToDates(obj: any): any {
  if (!obj) return obj;
  if (obj instanceof Timestamp) {
    return obj.toDate();
  }
  if (Array.isArray(obj)) {
    return obj.map(convertTimestampsToDates);
  }
  if (typeof obj === 'object') {
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = convertTimestampsToDates(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

// Get dashboard data for a hotel
export async function getHotelDashboardData(hotelId: string) {
    const hotelDetails = await getHotelById(hotelId);
    if (!hotelDetails) {
        return {
            hotelName: 'Hotel',
            stats: { totalRevenue: "0", totalBookings: 0, confirmedBookings: 0, pendingActions: 0 },
            recentActivities: []
        };
    }

    const { db } = getFirebaseAdmin();
    const bookingsRef = db.collection('hotels').doc(hotelId).collection('bookings');
    const bookingsSnapshot = await bookingsRef.get();

    let totalRevenue = 0;
    let confirmedBookings = 0;
    let pendingActions = 0;
    const recentActivities: any[] = [];

    bookingsSnapshot.forEach(doc => {
        const booking = convertTimestampsToDates(doc.data());
        if (booking.status === 'confirmed') {
            totalRevenue += parseFloat(booking.totalPrice || 0);
            confirmedBookings++;
        }
        if (booking.status === 'pending_guest') {
            pendingActions++;
        }
        if (booking.createdAt) {
             recentActivities.push({
                id: doc.id,
                description: `New booking from ${booking.guestName}.`,
                timestamp: format(booking.createdAt, 'dd.MM.yyyy HH:mm'),
            });
        }
    });
    
    // Sort activities descending by date
    recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());


    return {
        hotelName: hotelDetails.name,
        stats: {
            totalRevenue: totalRevenue.toFixed(2),
            totalBookings: bookingsSnapshot.size,
            confirmedBookings,
            pendingActions
        },
        recentActivities: recentActivities.slice(0, 5).map(a => ({...a, timestamp: a.timestamp.toString()})), // Return latest 5
    };
}
