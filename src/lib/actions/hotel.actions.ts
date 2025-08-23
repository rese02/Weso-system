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

const mockHotels = [
    {
      id: 'hotel-sonnenalp',
      name: 'Hotel Sonnenalp',
      domain: 'sonnenalp.weso.app',
      bookings: 125,
      status: 'active'
    },
    {
      id: 'seehotel-traum',
      name: 'Seehotel Traum',
      domain: 'seehotel-traum.weso.app',
      bookings: 88,
      status: 'active'
    },
    {
        id: 'berghotel-alpenruh',
        name: 'Berghotel Alpenruh',
        domain: 'alpenruh.weso.app',
        bookings: 42,
        status: 'inactive'
    }
];

// Function to fetch all hotels for the agency
export async function getHotels() {
  console.log('Fetching all hotels (using mock data)...');
  // Returning mock data to avoid server crash
  return Promise.resolve(mockHotels);
}

// Get a single hotel's data by its ID
export async function getHotelById(hotelId: string): Promise<Hotel | null> {
    console.log(`Fetching hotel ${hotelId} (using mock data)...`);
    const mockHotelData: { [key: string]: Hotel } = {
        'hotel-sonnenalp': {
            id: 'hotel-sonnenalp',
            name: 'Hotel Sonnenalp',
            address: 'Alpenstraße 1, 87561 Oberstdorf',
            contactEmail: 'manager@hotel-sonnenalp.com',
            contactPhone: '+49 8322 12345',
            domain: 'sonnenalp.weso.app'
        },
        'seehotel-traum': {
            id: 'seehotel-traum',
            name: 'Seehotel Traum',
            address: 'Seeweg 10, 82319 Starnberg',
            contactEmail: 'manager@seehotel-traum.de',
            contactPhone: '+49 8151 54321',
            domain: 'seehotel-traum.weso.app'
        }
    };
    
    if (mockHotelData[hotelId]) {
        return Promise.resolve(mockHotelData[hotelId]);
    }
    
    // Fallback for any other ID to prevent crashes
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
    console.log(`Fetching dashboard data for hotel ${hotelId}...`);
    const hotelDetails = await getHotelById(hotelId);
    
    const defaultData = {
        hotelName: hotelDetails?.name ?? 'Hotel',
        stats: { totalRevenue: "0", totalBookings: 0, confirmedBookings: 0, pendingActions: 0 },
        recentActivities: []
    }

    if (!hotelDetails) {
        return defaultData;
    }
    
    // Mocking dashboard data as well
    const mockDashboardData: any = {
        'hotel-sonnenalp': {
            stats: { totalRevenue: "10,500", totalBookings: 25, confirmedBookings: 15, pendingActions: 5 },
            recentActivities: [
                { id: '1', description: 'Buchung für Max Mustermann wurde aktualisiert. Status: confirmed', timestamp: formatDistanceToNow(new Date(), { addSuffix: true, locale: de })},
                { id: '2', description: 'Buchung für Erika Mustermann wurde aktualisiert. Status: pending_guest', timestamp: formatDistanceToNow(new Date(Date.now() - 1000 * 60 * 60 * 2), { addSuffix: true, locale: de })},
            ]
        },
        'seehotel-traum': {
            stats: { totalRevenue: "8,200", totalBookings: 20, confirmedBookings: 12, pendingActions: 3 },
            recentActivities: [
                { id: '3', description: 'Buchung für John Doe wurde aktualisiert. Status: confirmed', timestamp: formatDistanceToNow(new Date(), { addSuffix: true, locale: de })},
            ]
        }
    };
    
    const dashboardData = mockDashboardData[hotelId] ?? defaultData;

    return {
        hotelName: hotelDetails.name,
        stats: dashboardData.stats,
        recentActivities: dashboardData.recentActivities
    }
}
