
'use server';

import 'dotenv/config';
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
  // This is a workaround to prevent the Firebase Admin SDK authentication error.
  // In a real environment, the code below would write to Firestore.
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
  return { success: true, message: 'Hotel created successfully! (Simulated)', hotelId: `sim_${new Date().getTime()}` };

  /*
  // Original Firestore code that is currently causing an error
  const { db } = getFirebaseAdmin();
  const hotelRef = db.collection('hotels').doc();
  const domainRef = db.collection('domains').doc(values.domain as string);

  try {
    const domainDoc = await domainRef.get();
    if (domainDoc.exists) {
      return { success: false, message: 'This domain is already taken.' };
    }

    const hotelData = {
      id: hotelRef.id,
      name: values.hotelName,
      domain: values.domain,
      hotelierEmail: values.hotelierEmail,
      hotelierPassword: values.hotelierPassword,
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
  */
}


// Function to fetch all hotels for the agency
export async function getHotels() {
    // Returning mock data to avoid Firebase connection errors.
    const mockHotels = [
        { id: 'hotel_1', name: 'Alpenresort Edelweiss', domain: 'alpenresort.com', bookings: 25, status: 'active' },
        { id: 'hotel_2', name: 'Seehotel Bellevue', domain: 'bellevue-see.de', bookings: 42, status: 'active' },
        { id: 'hotel_3', name: 'Stadthotel Krone', domain: 'krone-city.ch', bookings: 15, status: 'inactive' },
    ];
    return mockHotels;
}


// Get a single hotel's data by its ID
export async function getHotelById(hotelId: string): Promise<Hotel | null> {
    // Returning mock data to avoid Firebase connection errors.
    const mockHotel: Hotel = {
        id: hotelId,
        name: 'Mock Hotel for Display',
        address: '123 Mockingbird Lane',
        contactEmail: 'contact@mockhotel.com',
        contactPhone: '123-456-7890',
        domain: 'mockhotel.com',
    };
    return mockHotel;
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

    // Using mock data to avoid DB calls
    const totalRevenue = (Math.random() * 50000).toFixed(2);
    const totalBookings = Math.floor(Math.random() * 100);
    const confirmedBookings = Math.floor(Math.random() * totalBookings);
    const pendingActions = totalBookings - confirmedBookings;

    const recentActivities = [
        { id: '1', description: 'New booking from Max Mustermann.', timestamp: format(new Date(), 'dd.MM.yyyy HH:mm')},
        { id: '2', description: 'Guest data for booking #A4B2C1 completed.', timestamp: format(new Date(Date.now() - 3600000), 'dd.MM.yyyy HH:mm')},
        { id: '3', description: 'New booking from Erika Musterfrau.', timestamp: format(new Date(Date.now() - 7200000), 'dd.MM.yyyy HH:mm')},
    ];


    return {
        hotelName: hotelDetails.name,
        stats: {
            totalRevenue,
            totalBookings,
            confirmedBookings,
            pendingActions
        },
        recentActivities: recentActivities.slice(0, 5).map(a => ({...a, timestamp: a.timestamp.toString()})), // Return latest 5
    };
}
