
'use server';

import type { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { format } from 'date-fns';
import type { Hotel } from '@/lib/definitions';


// This is the new, more robust createHotel action based on user feedback.
// The old `createHotel` function that took form values is replaced by this.
// The front-end form (`create-hotel/page.tsx`) will need to be adapted to call this action
// with the appropriate, simplified input. For now, we are providing the new backend logic.

const CreateHotelSchema = z.object({
  name: z.string().min(2, "Hotel name must be at least 2 characters."),
  // The agency user ID should be passed from the authenticated session
  ownerId: z.string().min(1, "Owner ID is required."), 
  address: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  locale: z.string().optional(),
});

export type CreateHotelInput = z.infer<typeof CreateHotelSchema>;

/**
 * Creates a hotel document, a default wizardConfig, and seeds a default room.
 * - Creates a document in /hotels/{hotelId}
 * - Creates /hotels/{hotelId}/wizardConfig/default
 * - Creates /hotels/{hotelId}/rooms/{roomId} with a default room
 */
export async function createHotel(input: CreateHotelInput) {
    const parsed = CreateHotelSchema.parse(input);
    const { db } = getFirebaseAdmin();
    const hotelRef = db.collection('hotels').doc();
    const now = FieldValue.serverTimestamp();

    const hotelDoc = {
        name: parsed.name,
        address: parsed.address || null,
        ownerId: parsed.ownerId, // This would be the agency's user ID
        timezone: parsed.timezone || 'Europe/Rome',
        currency: parsed.currency || 'EUR',
        locale: parsed.locale || 'de-DE',
        settings: {
            allowGuestUploads: true,
            maxUploadMb: 10,
            bookingLinkExpiryHours: 48,
        },
        createdAt: now,
        updatedAt: now,
    };

    const defaultWizard = {
        createdAt: now,
        updatedAt: now,
        steps: [
            {
                id: 'guest-info',
                title: 'Gäste Informationen',
                description: 'Name, Kontakt & Adresse',
                inputs: [
                    { key: 'firstName', label: 'Vorname', type: 'text', required: true },
                    { key: 'lastName', label: 'Nachname', type: 'text', required: true },
                    { key: 'email', label: 'E‑Mail', type: 'email', required: true },
                    { key: 'phone', label: 'Telefon', type: 'tel', required: false },
                ],
            },
            {
                id: 'documents',
                title: 'Dokumente',
                description: 'Lade Ausweis/Pass hoch (falls erforderlich)',
                inputs: [
                    { key: 'id_document', label: 'Ausweis / Reisepass', type: 'file', required: false },
                ],
            },
            {
                id: 'confirm',
                title: 'Bestätigung',
                description: 'Einwilligungen & Check',
                inputs: [
                    { key: 'consent_gdpr', label: 'Einwilligung zur Datenverarbeitung', type: 'checkbox', required: true },
                ],
            },
        ],
    };
    
    const defaultRoom = {
        title: 'Standardzimmer',
        description: 'Standardmäßig angelegtes Zimmer',
        capacity: 2,
        price: 0,
        createdAt: now,
        updatedAt: now,
    };
    
    const defaultBookingTemplate = {
        title: 'Standard Buchungsvorlage',
        description: 'Vorlage für neue Buchungen',
        createdAt: now,
        updatedAt: now,
        template: {
            allowPartialPayments: false,
        },
    };

    try {
        await db.runTransaction(async (tx) => {
            tx.set(hotelRef, hotelDoc);
            
            const wizardRef = hotelRef.collection('wizardConfig').doc('default');
            tx.set(wizardRef, defaultWizard);
            
            const roomRef = hotelRef.collection('rooms').doc();
            tx.set(roomRef, defaultRoom);
            
            const bookingTemplateRef = hotelRef.collection('bookingTemplates').doc('default');
            tx.set(bookingTemplateRef, defaultBookingTemplate);
        });

        console.log(`[Action: createHotel] Successfully created hotel with ID: ${hotelRef.id}`);
        return {
            success: true,
            hotelId: hotelRef.id,
            message: 'Hotel angelegt und mit Default Wizard + Room geseedet.',
        };
    } catch (err) {
        console.error('[Action: createHotel] Transaction error', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return {
            success: false,
            error: errorMessage,
        };
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
            // Count bookings in the top-level collection for this hotel
            const bookingsSnapshot = await db.collection('bookings').where('hotelId', '==', doc.id).count().get();
            const bookingsCount = bookingsSnapshot.data().count;
            
            return {
                ...hotelData,
                id: doc.id,
                bookings: bookingsCount,
                status: hotelData.status || 'active',
            };
        }));

        console.log(`[Action: getHotels] Found ${hotels.length} hotels.`);
        return JSON.parse(JSON.stringify(hotels));
    } catch (error) {
        console.error("[Action: getHotels] Error fetching hotels:", error);
        return [];
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

        const bookingsRef = db.collection('bookings');
        
        const confirmedBookingsSnapshot = await bookingsRef.where('hotelId', '==', hotelId).where('status', '==', 'confirmed').get();
        const pendingBookingsSnapshot = await bookingsRef.where('hotelId', '==', hotelId).where('status', '==', 'pending_guest').get();
        const allBookingsSnapshot = await bookingsRef.where('hotelId', '==', hotelId).get();
        
        const confirmedBookings = confirmedBookingsSnapshot.docs;
        const totalRevenue = confirmedBookings.reduce((sum, doc) => sum + parseFloat(doc.data().totalPrice || 0), 0);
        
        const recentActivitiesSnapshot = await bookingsRef.where('hotelId', '==', hotelId).orderBy('createdAt', 'desc').limit(5).get();
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
        return {
            hotelName: 'Hotel',
            stats: { totalRevenue: "0.00", totalBookings: 0, confirmedBookings: 0, pendingActions: 0 },
            recentActivities: []
        };
    }
}
