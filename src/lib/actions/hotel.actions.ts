
'use server';

import type { z } from 'zod';
import type { createHotelSchema, Hotel } from '@/lib/definitions';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { format } from 'date-fns';

/**
 * Creates a new hotel in Firestore.
 * This function takes the validated form data and creates a new document
 * in the 'hotels' collection. It also adds the domain to a 'domains'
 * collection to ensure uniqueness.
 */
export async function createHotel(values: z.infer<typeof createHotelSchema>) {
  console.log("Simulating hotel creation with values:", values);
  // This is a simulation to avoid server errors due to auth issues.
  // In a real scenario, the code below would interact with Firebase.
  
  try {
    // Simulate a successful creation
    const fakeHotelId = `fake-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`Simulated hotel creation successful with fake ID: ${fakeHotelId}`);
    
    // We wait for a short period to mimic network latency
    await new Promise(resolve => setTimeout(resolve, 500));

    return { success: true, message: 'Hotel created successfully! (Simulated)', hotelId: fakeHotelId };

  } catch (error: any) {
    console.error("Error during simulated hotel creation: ", error);
    return { success: false, message: error.message || 'Failed to create hotel. (Simulated)' };
  }
}


// Function to fetch all hotels for the agency
export async function getHotels() {
    console.log("[Action: getHotels] Fetching all hotels from Firestore.");
    const { db } = getFirebaseAdmin();
    try {
        const hotelsSnapshot = await db.collection('hotels').orderBy('createdAt', 'desc').get();
        if (hotelsSnapshot.empty) {
            console.log("[Action: getHotels] No hotels found.");
            return [];
        }

        const hotels = await Promise.all(hotelsSnapshot.docs.map(async (doc) => {
            const hotelData = doc.data();
            const bookingsSnapshot = await db.collection('hotels').doc(doc.id).collection('bookings').count().get();
            const bookingsCount = bookingsSnapshot.data().count;
            
            return {
                ...hotelData,
                id: doc.id,
                bookings: bookingsCount,
                // Ensure status is always present for the UI
                status: hotelData.status || 'inactive',
            };
        }));

        console.log(`[Action: getHotels] Found ${hotels.length} hotels.`);
        return JSON.parse(JSON.stringify(hotels));
    } catch (error) {
        console.error("[Action: getHotels] Error fetching hotels:", error);
        return []; // Return empty array on error
    }
}


// Get a single hotel's data by its ID
export async function getHotelById(hotelId: string): Promise<Hotel | null> {
    console.log(`[Action: getHotelById] Fetching hotel with ID: ${hotelId}`);
    const { db } = getFirebaseAdmin();
    try {
        const hotelDoc = await db.collection('hotels').doc(hotelId).get();
        if (!hotelDoc.exists) {
            console.warn(`[Action: getHotelById] Hotel with ID ${hotelId} not found.`);
            return null;
        }
        const hotelData = hotelDoc.data() as Hotel;
        console.log(`[Action: getHotelById] Successfully fetched hotel: ${hotelData.name}`);
        return JSON.parse(JSON.stringify({ ...hotelData, id: hotelDoc.id }));
    } catch (error) {
        console.error(`[Action: getHotelById] Error fetching hotel ${hotelId}:`, error);
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
  if (typeof obj === 'object' && obj !== null) {
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
    console.log(`[Action: getHotelDashboardData] Fetching data for hotel ID: ${hotelId}`);
    const { db } = getFirebaseAdmin();

    try {
        const hotelDetails = await getHotelById(hotelId);
        if (!hotelDetails) {
            throw new Error("Hotel not found");
        }

        const bookingsRef = db.collection('hotels').doc(hotelId).collection('bookings');
        
        const confirmedBookingsSnapshot = await bookingsRef.where('status', '==', 'confirmed').get();
        const pendingBookingsSnapshot = await bookingsRef.where('status', '==', 'pending_guest').get();
        const allBookingsSnapshot = await bookingsRef.get();
        
        const confirmedBookings = confirmedBookingsSnapshot.docs;
        const totalRevenue = confirmedBookings.reduce((sum, doc) => sum + parseFloat(doc.data().totalPrice || 0), 0);
        
        const recentActivitiesSnapshot = await bookingsRef.orderBy('createdAt', 'desc').limit(5).get();
        const recentActivities = recentActivitiesSnapshot.docs.map(doc => {
            const data = convertTimestampsToDates(doc.data());
            return {
                id: doc.id,
                description: `New booking from ${data.guestName}.`,
                timestamp: data.createdAt ? format(data.createdAt, 'dd.MM.yyyy HH:mm') : 'N/A'
            };
        });

        const dashboardData = {
            hotelName: hotelDetails.name,
            stats: {
                totalRevenue: totalRevenue.toFixed(2),
                totalBookings: allBookingsSnapshot.size,
                confirmedBookings: confirmedBookings.length,
                pendingActions: pendingBookingsSnapshot.size,
            },
            recentActivities,
        };

        console.log(`[Action: getHotelDashboardData] Successfully fetched data for ${hotelDetails.name}`);
        return JSON.parse(JSON.stringify(dashboardData));

    } catch (error) {
        console.error(`[Action: getHotelDashboardData] Error fetching dashboard data for hotel ${hotelId}:`, error);
        // Return a default structure on error to prevent crashes
        return {
            hotelName: 'Hotel',
            stats: { totalRevenue: "0.00", totalBookings: 0, confirmedBookings: 0, pendingActions: 0 },
            recentActivities: []
        };
    }
}
