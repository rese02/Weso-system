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
 */
export async function createHotel(values: z.infer<typeof createHotelSchema>) {
  console.log('Creating hotel with values:', values.hotelName);

  const { db: adminDb, auth: adminAuth } = getFirebaseAdmin();

  if (!adminDb || !adminAuth) {
    console.error("Firebase Admin SDK not initialized.");
    return { success: false, message: 'Server configuration error.' };
  }

  const hotelRef = adminDb.collection('hotels').doc();
  const hotelId = hotelRef.id;

  try {
    // --- 1. Create Firebase Auth User (conceptual) ---
    // In a real app, this would be:
    // const userRecord = await adminAuth.createUser({
    //   email: values.hotelierEmail,
    //   password: values.hotelierPassword,
    //   displayName: values.hotelName,
    //   emailVerified: false,
    // });
    // const hotelierUid = userRecord.uid;
    // For this prototype, we'll use a placeholder UID.
    const hotelierUid = `uid_${hotelId}`;
    console.log(`Simulated Auth user creation for ${values.hotelierEmail} with UID ${hotelierUid}`);


    // --- 2. Set Custom Claims (conceptual) ---
    // In a real app, this would be:
    // await adminAuth.setCustomUserClaims(hotelierUid, { role: 'hotel', hotelId: hotelId });
    console.log(`Simulated setting custom claims for UID ${hotelierUid}: { role: 'hotel', hotelId: '${hotelId}' }`);

    
    // --- 3. Create Firestore Documents ---
    const hotelData = {
      id: hotelId,
      agencyId: "agency_weso_systems",
      name: values.hotelName,
      domain: values.domain || `${values.hotelName.toLowerCase().replace(/\s+/g, '-')}.weso.app`,
      logoUrl: '',
      ownerEmail: values.hotelierEmail,
      ownerUid: hotelierUid,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
      address: values.fullAddress,
      boardTypes: values.meals,
      roomCategories: values.roomCategories.map(c => c.name),
      bankAccountHolder: values.bankAccountHolder,
      bankIBAN: values.iban,
      bankBIC: values.bic,
      bankName: values.bankName,
      createdAt: FieldValue.serverTimestamp(),
    };
    
    // Create domain mapping for tenancy resolution
    const domainMapping = {
      hotelId: hotelId,
      createdAt: FieldValue.serverTimestamp(),
    };

    const batch = adminDb.batch();
    batch.set(hotelRef, hotelData);
    batch.set(adminDb.collection('domains').doc(hotelData.domain), domainMapping);
    
    await batch.commit();
    console.log(`Firestore documents created for hotel ${hotelId} and domain ${hotelData.domain}`);

    // --- 4. Generate & Send Onboarding Link (conceptual) ---
    // In a real app, you would generate a password reset or email verification link.
    const onboardingLink = `https://${hotelData.domain}/login`;
    console.log(`Generated onboarding link for hotelier: ${onboardingLink}`);
    // Here you would use an email service to send the link.
    
    return { success: true, message: 'Hotel created successfully!', hotelId: hotelId };
  } catch (e) {
    console.error("Error creating hotel: ", e);
    // @ts-ignore
    return { success: false, message: e.message || 'Failed to create hotel.' };
  }
}

// Function to fetch all hotels for the agency
export async function getHotels() {
    const { db: adminDb } = getFirebaseAdmin();
    if (!adminDb) {
        console.error("Firestore not initialized.");
        return [];
    }
    try {
        const hotelsRef = adminDb.collection('hotels');
        const snapshot = await hotelsRef.orderBy('createdAt', 'desc').get();
        if (snapshot.empty) {
            return [];
        }

        const hotels = await Promise.all(snapshot.docs.map(async (doc) => {
            const hotelData = doc.data() as Hotel;
            // Fetch booking count for each hotel
            const bookingsSnapshot = await adminDb.collection('hotels').doc(hotelData.id).collection('bookings').get();
            return {
                ...hotelData,
                bookings: bookingsSnapshot.size, // Get the number of bookings
                status: 'active' // Placeholder status
            };
        }));

        return hotels;
    } catch (error) {
        console.error("Error fetching hotels: ", error);
        return [];
    }
}

// Get a single hotel's data by its ID
export async function getHotelById(hotelId: string): Promise<Hotel | null> {
    const { db: adminDb } = getFirebaseAdmin();
    if (!adminDb) {
      console.error("Firestore not initialized.");
      return null;
    }
    try {
      const hotelDoc = await adminDb.collection('hotels').doc(hotelId).get();
      if (!hotelDoc.exists) {
        console.warn(`Hotel with id ${hotelId} not found.`);
        return null;
      }
      return hotelDoc.data() as Hotel;

    } catch (error) {
       console.error(`Error fetching hotel by ID ${hotelId}: `, error);
       return null;
    }
}


// Placeholder to get the dashboard data for a hotel
export async function getHotelDashboardData(hotelId: string) {
    const { db: adminDb } = getFirebaseAdmin();
    const hotelDetails = await getHotelById(hotelId);
    
    if (!hotelDetails || !adminDb) {
        return {
            hotelName: 'Hotel',
            stats: { totalRevenue: "0", totalBookings: 0, confirmedBookings: 0, pendingActions: 0 },
            recentActivities: []
        };
    }
    
    try {
        const bookingsRef = adminDb.collection('hotels').doc(hotelId).collection('bookings');
        const bookingsSnapshot = await bookingsRef.get();
        
        let totalRevenue = 0;
        let totalBookings = 0;
        let confirmedBookings = 0;
        let pendingActions = 0;
        
        const recentActivities = bookingsSnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id }))
             // @ts-ignore
            .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
            .slice(0, 5)
            .map(booking => ({
                id: booking.id,
                // @ts-ignore
                description: `Booking for ${booking.guestName} was updated. Status: ${booking.status}`,
                 // @ts-ignore
                timestamp: formatDistanceToNow(booking.createdAt.toDate(), { addSuffix: true, locale: de })
            }));

        bookingsSnapshot.forEach(doc => {
            const booking = doc.data();
            totalBookings++;
            if (booking.status === 'confirmed') {
                confirmedBookings++;
                // In a real app, price would be a number
                totalRevenue += parseFloat(booking.totalPrice || "0");
            }
            if (booking.status === 'pending_guest') {
                pendingActions++;
            }
        });
        
        return {
            hotelName: hotelDetails.name,
            stats: {
                totalRevenue: totalRevenue.toFixed(2),
                totalBookings,
                confirmedBookings,
                pendingActions
            },
            recentActivities
        };
    } catch (error) {
        console.error(`Error fetching dashboard data for hotel ${hotelId}:`, error);
        return {
            hotelName: hotelDetails.name,
            stats: { totalRevenue: "0", totalBookings: 0, confirmedBookings: 0, pendingActions: 0 },
            recentActivities: []
        };
    }
}
