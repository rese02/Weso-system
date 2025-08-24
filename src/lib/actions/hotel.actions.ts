
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { createHotelSchema } from '@/lib/definitions';
import type { Hotel } from '@/lib/definitions';


// This schema is used for validating the data from the form on the server.
// It is slightly different from the client-side schema as it expects the ownerId.
const CreateHotelServerSchema = createHotelSchema.extend({
  agencyId: z.string().min(1, "Agency ID is required."),
  ownerUid: z.string().min(1, "Owner UID is required."),
});

/**
 * Creates a hotel document based on the provided flat structure.
 */
export async function createHotel(values: z.infer<typeof CreateHotelServerSchema>) {
  console.log('admin.apps.length', getFirebaseAdmin() ? 'SDK seems loaded' : 'SDK not loaded');
  const parsed = CreateHotelServerSchema.safeParse(values);

  if (!parsed.success) {
    const errorDetails = parsed.error.flatten().fieldErrors;
    console.error("Validation failed:", errorDetails);
    return {
        success: false,
        message: "Validation failed. Please check the form fields.",
        errors: errorDetails,
    };
  }

  const { db } = getFirebaseAdmin();
  const hotelRef = db.collection('hotels').doc(); 
  const now = FieldValue.serverTimestamp();
  
  const { logo, ...dataToStore } = parsed.data;

  const hotelDoc = {
    ...dataToStore,
    createdAt: now,
    // Note: In a real app, handle logo upload and get the URL.
    // For now, we'll skip storing the logo URL until a file upload service is implemented.
    logoUrl: '',
  };

  try {
    await hotelRef.set(hotelDoc);

    console.log(`Hotel created successfully with ID: ${hotelRef.id}`);
    return {
      success: true,
      hotelId: hotelRef.id,
      message: 'Hotel created successfully.',
    };
  } catch (err) {
    console.error('createHotel transaction error', err);
    // Provide a more informative error message
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Database operation failed: ${errorMessage}`,
    };
  }
}

export async function getHotels(): Promise<(Hotel & {id: string, name: string, domain: string, bookings: number, status: 'active' | 'inactive' })[]> {
    console.log('[Action: getHotels] Fetching all hotels');
    const { db } = getFirebaseAdmin();
    try {
        const snapshot = await db.collection('hotels').orderBy('createdAt', 'desc').get();
        if (snapshot.empty) {
            console.log('[Action: getHotels] No hotels found.');
            return [];
        }
        const hotels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (Hotel & {id: string, name: string, domain: string})[];
        
        // Augment with dummy data until booking counts are real
        return hotels.map(hotel => ({
            ...hotel,
            bookings: Math.floor(Math.random() * 50),
            status: Math.random() > 0.3 ? 'active' : 'inactive',
        }));

    } catch (error) {
        console.error("[Action: getHotels] Error fetching hotels:", error);
        return [];
    }
}

export async function getHotelById(hotelId: string): Promise<Hotel | null> {
    console.log(`[Action: getHotelById] Fetching hotel ${hotelId}`);
    const { db } = getFirebaseAdmin();
    try {
        const hotelDoc = await db.collection('hotels').doc(hotelId).get();
        if (!hotelDoc.exists) {
            console.warn(`[Action: getHotelById] Hotel ${hotelId} not found.`);
            return null;
        }
        const data = { id: hotelDoc.id, ...hotelDoc.data() } as Hotel;
        return JSON.parse(JSON.stringify(data));
    } catch (error) {
        console.error(`[Action: getHotelById] Error fetching hotel ${hotelId}:`, error);
        return null;
    }
}

export async function getHotelDashboardData(hotelId: string) {
    console.log(`[Action: getHotelDashboardData] Fetching data for hotel ${hotelId}`);
    const { db } = getFirebaseAdmin();

    try {
        const hotelDoc = await db.collection('hotels').doc(hotelId).get();
        if (!hotelDoc.exists) {
            throw new Error(`Hotel with ID ${hotelId} not found`);
        }

        const bookingsSnapshot = await db.collection('bookings').where('hotelId', '==', hotelId).get();

        let totalRevenue = 0;
        let confirmedBookings = 0;
        let pendingActions = 0;
        
        bookingsSnapshot.forEach(doc => {
            const booking = doc.data();
            if (booking.status === 'confirmed') {
                totalRevenue += parseFloat(booking.totalPrice || '0');
                confirmedBookings++;
            }
            if (booking.status === 'pending_guest') {
                pendingActions++;
            }
        });
        
        const recentActivities = bookingsSnapshot.docs
            .sort((a, b) => b.data().createdAt.toMillis() - a.data().createdAt.toMillis())
            .slice(0, 5)
            .map(doc => {
                const booking = doc.data();
                return {
                    id: doc.id,
                    description: `New booking created for ${booking.guestName}.`,
                    timestamp: new Date(booking.createdAt.toMillis()).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                };
            });
            
        const data = {
            hotelName: hotelDoc.data()?.name || 'Unnamed Hotel',
            stats: {
                totalRevenue: totalRevenue.toFixed(2),
                totalBookings: bookingsSnapshot.size,
                confirmedBookings: confirmedBookings,
                pendingActions: pendingActions,
            },
            recentActivities,
        };

        return JSON.parse(JSON.stringify(data));

    } catch (error) {
        console.error(`[Action: getHotelDashboardData] Error fetching data for hotel ${hotelId}:`, error);
        return null;
    }
}

    
