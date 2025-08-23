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

  try {
    const hotelRef = adminDb.collection('hotels').doc();
    const hotelId = hotelRef.id;

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
      agencyId: "agency_weso_systems",
      name: values.hotelName,
      domain: values.domain || `${values.hotelName.toLowerCase().replace(/\s+/g, '-')}.weso.app`,
      logoUrl: '',
      ownerEmail: values.hotelierEmail,
      ownerUid: hotelierUid,
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
  // --- TEMPORARY TEST DATA ---
  const testHotels = [
    {
      id: 'hotel-sonnenalp',
      name: 'Hotel Sonnenalp',
      domain: 'hotel-sonnenalp.de',
      bookings: 128,
      status: 'active'
    },
    {
      id: 'seehotel-traum',
      name: 'Seehotel Traum',
      domain: 'seehotel-traum.de',
      bookings: 74,
      status: 'active'
    }
  ];
  return testHotels;
}

// Get a single hotel's data by its ID
export async function getHotelById(hotelId: string) {
    console.log(`Fetching hotel ${hotelId}...`);
    if (!adminDb) {
      console.error("Firestore not initialized.");
      return { id: hotelId, name: `Error: Hotel ${hotelId} not found`, address: '', city: '', country: '' };
    }
    try {
      const hotelDoc = await adminDb.collection('hotels').doc(hotelId).get();
      if (!hotelDoc.exists) {
        console.warn(`Hotel with id ${hotelId} not found.`);
        return { id: hotelId, name: `Hotel ${hotelId} Not Found`, address: '', city: '', country: '' };
      }
      const data = hotelDoc.data()!;
      const addressParts = (data.contactAddress || '').split(',');
      return {
          id: hotelDoc.id,
          name: data.name || `Hotel ${hotelId}`,
          address: data.contactAddress || 'N/A',
          city: addressParts[1]?.trim() || 'N/A',
          country: addressParts[2]?.trim() || 'N/A'
      };
    } catch (error) {
       console.error(`Error fetching hotel by ID ${hotelId}: `, error);
       return { id: hotelId, name: `Error loading hotel`, address: '', city: '', country: '' };
    }
}


// Placeholder to get the dashboard data for a hotel
export async function getHotelDashboardData(hotelId: string) {
    console.log(`Fetching dashboard data for hotel ${hotelId}...`);
    const hotelDetails = await getHotelById(hotelId);
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        hotelName: hotelDetails.name,
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
