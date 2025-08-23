'use server';

import 'dotenv/config';
import type { z } from 'zod';
import type { createHotelSchema } from '@/lib/definitions';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Creates a new hotel, a corresponding Firebase Auth user for the hotelier,
 * and sets custom claims for role-based access control.
 */
export async function createHotel(values: z.infer<typeof createHotelSchema>) {
  console.log('Creating hotel with values:', values.hotelName);

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
  console.log('Fetching all hotels...');
   if (!adminDb) {
    console.error("Firestore not initialized for getHotels.");
    return [];
  }
  
  try {
    // In a real app, you would filter by agencyId
    const hotelsSnapshot = await adminDb.collection('hotels').orderBy('name').get();
    if (hotelsSnapshot.empty) {
      return [];
    }

    const hotels = await Promise.all(hotelsSnapshot.docs.map(async (doc) => {
      const hotelData = doc.data();
      const bookingsSnapshot = await doc.ref.collection('bookings').count().get();
      const bookingsCount = bookingsSnapshot.data().count;
      
      return {
        id: doc.id,
        name: hotelData.name,
        domain: hotelData.domain,
        bookings: bookingsCount,
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
export async function getHotelById(hotelId: string) {
    console.log(`Fetching hotel ${hotelId}...`);
    if (!adminDb) {
      console.error("Firestore not initialized.");
      return { id: hotelId, name: `Error: Hotel ${hotelId} not found`, address: '', city: '', country: '', domain:'' };
    }
    try {
      const hotelDoc = await adminDb.collection('hotels').doc(hotelId).get();
      if (!hotelDoc.exists) {
        console.warn(`Hotel with id ${hotelId} not found.`);
        return { id: hotelId, name: `Hotel ${hotelId} Not Found`, address: '', city: '', country: '', domain:'' };
      }
      const data = hotelDoc.data()!;
      const addressParts = (data.address || '').split(',');
      return {
          id: hotelDoc.id,
          name: data.name || `Hotel ${hotelId}`,
          address: data.address || 'N/A',
          city: addressParts[1]?.trim() || 'N/A',
          country: addressParts[2]?.trim() || 'N/A',
          domain: data.domain
      };
    } catch (error) {
       console.error(`Error fetching hotel by ID ${hotelId}: `, error);
       return { id: hotelId, name: `Error loading hotel`, address: '', city: '', country: '', domain:'' };
    }
}


// Placeholder to get the dashboard data for a hotel
export async function getHotelDashboardData(hotelId: string) {
    console.log(`Fetching dashboard data for hotel ${hotelId}...`);
    const hotelDetails = await getHotelById(hotelId);
     if (!adminDb) {
        return {
            hotelName: hotelDetails.name,
            stats: { totalRevenue: "0", totalBookings: 0, confirmedBookings: 0, pendingActions: 0 },
            recentActivities: []
        }
    }
    
    const bookingsRef = adminDb.collection('hotels').doc(hotelId).collection('bookings');
    const bookingsSnapshot = await bookingsRef.get();

    let totalBookings = 0;
    let confirmedBookings = 0;
    let pendingActions = 0;

    bookingsSnapshot.forEach(doc => {
        const booking = doc.data();
        totalBookings++;
        if (booking.status === 'confirmed') {
            confirmedBookings++;
        }
        if (booking.status === 'pending_guest') {
            pendingActions++;
        }
    });

    const recentActivitiesSnapshot = await bookingsRef.orderBy('createdAt', 'desc').limit(5).get();
    const recentActivities = recentActivitiesSnapshot.docs.map(doc => {
        const data = doc.data();
        const guestName = data.guestDetails ? `${data.guestDetails.firstName} ${data.guestDetails.lastName}` : data.guestName;
        return {
            id: doc.id.substring(0,6).toUpperCase(),
            description: `Booking for ${guestName} was updated. Status: ${data.status}`,
            timestamp: `some time ago` // In real app use formatDistanceToNow
        }
    });


    return {
        hotelName: hotelDetails.name,
        stats: {
            totalRevenue: "0", // Revenue calculation would require price data
            totalBookings: totalBookings,
            confirmedBookings: confirmedBookings,
            pendingActions: pendingActions,
        },
        recentActivities: recentActivities
    }
}
