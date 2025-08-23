
'use server';

// Server-side Firebase Admin actions for hotel creation + seeding

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import type { createHotelSchema } from '@/lib/definitions';


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
  const now = FieldValue.serverTimestamp();

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
