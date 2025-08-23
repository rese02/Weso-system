'use server';

import 'dotenv/config';
import type { z } from 'zod';
import type { createHotelSchema, Hotel } from '@/lib/definitions';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Creates a new hotel, a corresponding Firebase Auth user for the hotelier,
 * and sets custom claims for role-based access control.
 * THIS IS CURRENTLY A SIMULATION to avoid server auth errors.
 */
export async function createHotel(values: z.infer<typeof createHotelSchema>) {
  console.log('SIMULATING: Creating hotel with values:', values.hotelName);

  // This is a workaround for the "Could not refresh access token" error.
  // In a real, configured environment, you would use the Firebase Admin SDK.
  try {
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const simulatedHotelId = `hotel_${Date.now()}`;
    console.log(`SIMULATION: Generated hotelId: ${simulatedHotelId}`);
    
    // The following actions are what would happen in a real scenario.
    console.log(`SIMULATION: Would create Auth user for ${values.hotelierEmail}`);
    console.log(`SIMULATION: Would set custom claims for user.`);
    console.log(`SIMULATION: Would write to Firestore hotels and domains collections.`);

    return { success: true, message: 'Hotel created successfully! (Simulated)', hotelId: simulatedHotelId };

  } catch (e) {
    console.error("Error creating hotel (simulation fallback): ", e);
    // @ts-ignore
    return { success: false, message: e.message || 'Failed to create hotel.' };
  }
}

// Function to fetch all hotels for the agency - USES MOCK DATA
export async function getHotels() {
    console.log("MOCK DATA: Fetching hotels.");
    return [
        {
            id: 'hotel-sonnenalp',
            name: 'Hotel Sonnenalp',
            domain: 'sonnenalp.weso.app',
            bookings: 12,
            status: 'active',
            address: 'Sonnenweg 12, 87527 Ofterschwang',
            contactEmail: 'manager@hotel-sonnenalp.com',
            contactPhone: '08321 2720'
        },
        {
            id: 'seehotel-traum',
            name: 'Seehotel Traum',
            domain: 'seehotel.weso.app',
            bookings: 5,
            status: 'inactive',
            address: 'Seestraße 1, 82319 Starnberg',
            contactEmail: 'manager@seehotel-traum.de',
            contactPhone: '08151 4470'
        }
    ];
}

// Get a single hotel's data by its ID - USES MOCK DATA
export async function getHotelById(hotelId: string): Promise<Hotel | null> {
    console.log(`MOCK DATA: Fetching hotel by ID: ${hotelId}`);
    const hotels = await getHotels();
    const hotel = hotels.find(h => h.id === hotelId);

    if (!hotel) {
        console.warn(`MOCK DATA: Hotel with id ${hotelId} not found.`);
        return null;
    }
    return hotel;
}


// Placeholder to get the dashboard data for a hotel
export async function getHotelDashboardData(hotelId: string) {
    const hotelDetails = await getHotelById(hotelId);
    
    if (!hotelDetails) {
        return {
            hotelName: 'Hotel',
            stats: { totalRevenue: "0", totalBookings: 0, confirmedBookings: 0, pendingActions: 0 },
            recentActivities: []
        };
    }
    
    // Mock data for dashboard stats
    const mockData: { [key: string]: any } = {
        'hotel-sonnenalp': {
            stats: {
                totalRevenue: "12580.50",
                totalBookings: 12,
                confirmedBookings: 8,
                pendingActions: 4
            },
            recentActivities: [
                { id: '1', description: "Buchung für Max Mustermann wurde bestätigt.", timestamp: "vor 2 Stunden" },
                { id: '2', description: "Neue Buchung von Erika Mustermann erhalten.", timestamp: "vor 1 Tag" },
                { id: '3', description: "Gastdaten für Buchung #A4B1C3 vervollständigt.", timestamp: "vor 2 Tagen" },
            ]
        },
        'seehotel-traum': {
            stats: {
                totalRevenue: "4200.00",
                totalBookings: 5,
                confirmedBookings: 3,
                pendingActions: 2
            },
             recentActivities: [
                { id: '1', description: "Buchung für John Doe wurde storniert.", timestamp: "vor 5 Stunden" },
                { id: '2', description: "Neue Buchung von Jane Smith erhalten.", timestamp: "vor 3 Tagen" },
            ]
        }
    };
    
    const data = mockData[hotelId] || {
        stats: { totalRevenue: "0", totalBookings: 0, confirmedBookings: 0, pendingActions: 0 },
        recentActivities: []
    };

    return {
        hotelName: hotelDetails.name,
        ...data
    };
}
