
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import type { createHotelSchema } from '@/lib/definitions';
import type { Hotel } from '@/lib/definitions';


// This schema is used for validating the data from the form on the server.
// It is slightly different from the client-side schema as it expects the ownerId.
const CreateHotelServerSchema = z.object({
  hotelName: z.string().min(3, "Hotel name must be at least 3 characters."),
  domain: z.string().optional(),
  logo: z.any().optional(),
  hotelierEmail: z.string().email("Invalid email address."),
  hotelierPassword: z.string().min(8, "Password must be at least 8 characters."),
  contactEmail: z.string().email("Invalid contact email address."),
  contactPhone: z.string(),
  fullAddress: z.string().min(10, "Full address is required."),
  meals: z.array(z.string()),
  roomCategories: z.array(z.object({ name: z.string().min(2, {message: 'Category name is required'}) })).min(1, "At least one room category is required."),
  bankAccountHolder: z.string(),
  iban: z.string(),
  bic: z.string(),
  bankName: z.string(),
  ownerId: z.string().min(1, "Owner ID is required."),
});

/**
 * Creates a hotel document, sets up a default wizardConfig, and seeds a default room.
 * - Creates a document in /hotels/{hotelId}
 * - Creates /hotels/{hotelId}/wizardConfig/default
 * - Creates /hotels/{hotelId}/rooms/{roomId} with a default room
 */
export async function createHotel(values: z.infer<typeof createHotelSchema> & { ownerId: string }) {
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

  const hotelDoc = {
    name: parsed.data.hotelName,
    domain: parsed.data.domain,
    hotelierEmail: parsed.data.hotelierEmail,
    hotelierPassword: parsed.data.hotelierPassword, 
    contactEmail: parsed.data.contactEmail,
    contactPhone: parsed.data.contactPhone,
    address: parsed.data.fullAddress,
    meals: parsed.data.meals,
    roomCategories: parsed.data.roomCategories,
    bankDetails: {
        accountHolder: parsed.data.bankAccountHolder,
        iban: parsed.data.iban,
        bic: parsed.data.bic,
        bankName: parsed.data.bankName,
    },
    ownerId: parsed.data.ownerId,
    settings: {
        allowGuestUploads: true,
        maxUploadMb: 10,
        bookingLinkExpiryHours: 48,
    },
    createdAt: now,
    updatedAt: now,
  };
    
  // default wizard steps (easily adjustable)
  const defaultWizard = {
    createdAt: now,
    updatedAt: now,
    steps: [
      {
        id: 'guest-info',
        title: 'Guest Information',
        description: 'Name, Contact & Address',
        inputs: [
          { key: 'firstName', label: 'First Name', type: 'text', required: true },
          { key: 'lastName', label: 'Last Name', type: 'text', required: true },
          { key: 'email', label: 'Email', type: 'email', required: true },
          { key: 'phone', label: 'Phone', type: 'tel', required: false },
        ],
      },
      {
        id: 'documents',
        title: 'Documents',
        description: 'Upload ID/Passport (if required)',
        inputs: [
          { key: 'id_document', label: 'ID / Passport', type: 'file', required: false },
        ],
      },
      {
        id: 'confirm',
        title: 'Confirmation',
        description: 'Consents & Check',
        inputs: [
          { key: 'consent_gdpr', label: 'Consent to data processing', type: 'checkbox', required: true },
        ],
      },
    ],
  } as const;

  // Default room seed
  const defaultRooms = parsed.data.roomCategories.map(category => ({
    title: category.name,
    description: `Standard room of category ${category.name}`,
    capacity: 2, // Default capacity
    price: 0, // default, admin should adjust
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
        title: 'Standard Booking Template',
        description: 'Template for new bookings',
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
      message: 'Hotel created and seeded with Default Wizard + Rooms.',
    };
  } catch (err) {
    console.error('createHotel transaction error', err);
    // Provide a more informative error message
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `An unexpected error occurred on the server: ${errorMessage}`,
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
