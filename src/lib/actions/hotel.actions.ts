
'use server';

// Server-side Firebase Admin actions for hotel creation + seeding

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { createHotelSchema } from '@/lib/definitions';
import { z } from 'zod';

const CreateHotelServerSchema = z.object({
  hotelName: z.string().min(3),
  domain: z.string().optional(),
  hotelierEmail: z.string().email(),
  hotelierPassword: z.string().min(8),
  contactEmail: z.string().email(),
  contactPhone: z.string(),
  fullAddress: z.string().min(10),
  meals: z.array(z.string()),
  roomCategories: z.array(z.object({ name: z.string().min(2) })).min(1),
  bankAccountHolder: z.string(),
  iban: z.string(),
  bic: z.string(),
  bankName: z.string(),
  ownerId: z.string().min(1), // Added ownerId
});


/**
 * Erzeugt ein Hotel-Dokument, legt eine default wizardConfig an und seedet einen Default Room.
 * - Legt ein Dokument in /hotels/{hotelId}
 * - Legt /hotels/{hotelId}/wizardConfig/default an
 * - Legt /hotels/{hotelId}/rooms/{roomId} mit einem Default-Room an
 */
export async function createHotel(values: z.infer<typeof createHotelSchema> & { ownerId: string }) {
  const parsed = CreateHotelServerSchema.parse(values);

  const { db } = getFirebaseAdmin();
  const hotelRef = db.collection('hotels').doc(); 
  const now = db.FieldValue.serverTimestamp();

  const hotelDoc = {
    name: parsed.hotelName,
    domain: parsed.domain,
    hotelierEmail: parsed.hotelierEmail,
    hotelierPassword: parsed.hotelierPassword, 
    contactEmail: parsed.contactEmail,
    contactPhone: parsed.contactPhone,
    address: parsed.fullAddress,
    meals: parsed.meals,
    roomCategories: parsed.roomCategories,
    bankDetails: {
        accountHolder: parsed.bankAccountHolder,
        iban: parsed.iban,
        bic: parsed.bic,
        bankName: parsed.bankName,
    },
    ownerId: parsed.ownerId,
    settings: {
        allowGuestUploads: true,
        maxUploadMb: 10,
        bookingLinkExpiryHours: 48,
    },
    createdAt: now,
    updatedAt: now,
  };
    
  // default wizard steps (leicht anpassbar)
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
  } as const;

  // Default room seed
  const defaultRooms = parsed.roomCategories.map(category => ({
    title: category.name,
    description: `Standardmäßig angelegtes Zimmer der Kategorie ${category.name}`,
    capacity: 2, // Default capacity
    price: 0, // default, Admin sollte anpassen
    createdAt: now,
    updatedAt: now,
  }));


  // Transactional approach: set hotel doc + seed subcollections
  try {
    await db.runTransaction(async (tx) => {
      tx.set(hotelRef, hotelDoc);

      const wizardRef = hotelRef.collection('wizardConfig').doc('default');
      tx.set(wizardRef, defaultWizard);

      // Seed a room for each category
      defaultRooms.forEach(room => {
        const roomRef = hotelRef.collection('rooms').doc();
        tx.set(roomRef, room);
      });
      
      const bookingTemplateRef = hotelRef.collection('bookingTemplates').doc('default');
      tx.set(bookingTemplateRef, {
        title: 'Standard Buchungsvorlage',
        description: 'Vorlage für neue Buchungen',
        createdAt: now,
        updatedAt: now,
        template: {
          allowPartialPayments: false,
        },
      });
    });

    return {
      success: true,
      hotelId: hotelRef.id,
      message: 'Hotel angelegt und mit Default Wizard + Rooms geseedet.',
    };
  } catch (err) {
    console.error('createHotel transaction error', err);
    return {
      success: false,
      message: (err as Error).message || String(err),
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
            const bookingsSnapshot = await db.collection('bookings').where('hotelId', '==', doc.id).count().get();
            const bookingsCount = bookingsSnapshot.data().count;
            
            return {
                ...hotelData,
                id: doc.id,
                name: hotelData.name || hotelData.hotelName,
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
        const name = hotelData.name || (hotelData as any).hotelName;
        const address = hotelData.address || (hotelData as any).fullAddress;

        console.log(`[Action: getHotelById] Successfully fetched hotel: ${name}`);
        return JSON.parse(JSON.stringify({ ...hotelData, id: hotelDoc.id, name, address }));
    } catch (error) {
        console.error(`[Action: getHotelById] Error fetching hotel ${hotelId}:`, error);
        return null;
    }
}

// Helper function to convert Firestore Timestamps to JS Dates in nested objects
function convertTimestampsToDates(obj: any): any {
  const { Timestamp } = require('firebase-admin/firestore');
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
    const { format } = require('date-fns');

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

    