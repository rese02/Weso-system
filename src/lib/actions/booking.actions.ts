
'use server';

import type { z } from 'zod';
import type { createBookingSchema, Booking, hotelDirectBookingSchema } from '@/lib/definitions';
import { generateConfirmationEmail } from '@/ai/flows/generate-confirmation-email';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { sendEmail } from './email.actions';
import { format } from 'date-fns';

// Helper function to convert Firestore Timestamps to JS Dates in nested objects
function convertTimestampsToDates(obj: any): any {
  if (!obj) return obj;
  if (obj instanceof Timestamp) {
    return obj.toDate();
  }
  if (Array.isArray(obj)) {
    return obj.map(convertTimestampsToDates);
  }
  if (typeof obj === 'object') {
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

// Function to create a new booking from the hotelier dashboard directly
export async function createDirectBooking(hotelId: string, values: z.infer<typeof hotelDirectBookingSchema>) {
    console.log(`[Action: createDirectBooking] START for hotel ${hotelId}`, values);
    const { db: adminDb } = getFirebaseAdmin();
    if (!adminDb) {
        console.error("[Action: createDirectBooking] Firestore not initialized.");
        return { success: false, message: 'Server configuration error.' };
    }

    try {
        const hotelRef = adminDb.collection('hotels').doc(hotelId);
        const bookingRef = hotelRef.collection('bookings').doc();

        const bookingData = {
            id: bookingRef.id,
            hotelId: hotelId,
            guestName: `${values.firstName} ${values.lastName}`,
            checkInDate: Timestamp.fromDate(values.dateRange.from),
            checkOutDate: Timestamp.fromDate(values.dateRange.to),
            status: 'confirmed', // Directly confirmed as it's created by the hotelier
            guestLinkId: '', // No guest link needed for direct bookings
            language: values.language,
            mealPlan: values.mealPlan,
            totalPrice: values.totalPrice,
            rooms: values.rooms,
            internalNotes: values.internalNotes,
            guestDetails: {
                firstName: values.firstName,
                lastName: values.lastName,
                email: '', // Not collected in this form
                phone: '', // Not collected in this form
            },
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        await bookingRef.set(bookingData);

        console.log(`[Action: createDirectBooking] SUCCESS. Booking ${bookingRef.id} created.`);
        return { success: true, message: 'Booking created successfully!' };
    } catch (error) {
        console.error("[Action: createDirectBooking] FATAL ERROR: ", error);
        return { success: false, message: 'Failed to create booking due to a server error.' };
    }
}


// Function to create a new booking and generate a guest link
export async function createBookingLink(hotelId: string, values: z.infer<typeof createBookingSchema>) {
  console.log(`[Action: createBookingLink] START for hotel ${hotelId}`, values);
  const { db: adminDb } = getFirebaseAdmin();
  if (!adminDb) {
    console.error("[Action: createBookingLink] Firestore not initialized.");
    return { success: false, message: 'Server configuration error.' };
  }

  try {
    const hotelRef = adminDb.collection('hotels').doc(hotelId);
    const guestLinkRef = adminDb.collection('guestLinks').doc();
    const bookingRef = hotelRef.collection('bookings').doc();

    const bookingData = {
        id: bookingRef.id,
        hotelId: hotelId,
        guestName: values.guestName,
        checkInDate: Timestamp.fromDate(values.checkInDate),
        checkOutDate: Timestamp.fromDate(values.checkOutDate),
        roomType: values.roomType,
        language: values.language, // Save language
        status: 'pending_guest',
        guestLinkId: guestLinkRef.id,
        createdAt: FieldValue.serverTimestamp(),
    };
    
    const guestLinkData = {
        id: guestLinkRef.id,
        bookingId: bookingRef.id,
        hotelId: hotelId, // Storing hotelId for secure verification
        isCompleted: false,
        createdAt: FieldValue.serverTimestamp(),
    }
    console.log(`[Action: createBookingLink] Writing to Firestore. Booking Path: ${bookingRef.path}, Link Path: ${guestLinkRef.path}`);

    // Use a batch write to ensure atomicity
    const batch = adminDb.batch();
    batch.set(bookingRef, bookingData);
    batch.set(guestLinkRef, guestLinkData);
    
    await batch.commit();

    console.log(`[Action: createBookingLink] SUCCESS. Generated link: /guest/${guestLinkRef.id}`);
    return { success: true, message: 'Booking link created!', link: `/guest/${guestLinkRef.id}` };
  } catch (error) {
    console.error("[Action: createBookingLink] FATAL ERROR: ", error);
    return { success: false, message: 'Failed to create booking link due to a server error.' };
  }
}

// Function to get bookings for a specific hotel
export async function getBookingsByHotel(hotelId: string): Promise<Booking[]> {
    const { db: adminDb } = getFirebaseAdmin();
    if (!adminDb) {
        console.error("[Action: getBookingsByHotel] Firestore not initialized.");
        return [];
    }

    try {
        const bookingsRef = adminDb.collection('hotels').doc(hotelId).collection('bookings');
        const snapshot = await bookingsRef.orderBy('createdAt', 'desc').get();
        
        if (snapshot.empty) {
            return [];
        }
        
        // Using convertTimestampsToDates to process each document
        const bookings = snapshot.docs.map(doc => convertTimestampsToDates(doc.data()) as Booking);
        return JSON.parse(JSON.stringify(bookings));

    } catch (error) {
        console.error(`[Action: getBookingsByHotel] Error fetching bookings for hotel ${hotelId}:`, error);
        return [];
    }
}

// Function to get details for a single booking
export async function getBookingDetails(bookingId: string, hotelId: string): Promise<Booking | null> {
    const { db: adminDb } = getFirebaseAdmin();
    if (!adminDb) {
        console.error("[Action: getBookingDetails] Firestore not initialized.");
        return null;
    }
    try {
        const bookingDoc = await adminDb.collection('hotels').doc(hotelId).collection('bookings').doc(bookingId).get();
        if (!bookingDoc.exists) {
            console.warn(`[Action: getBookingDetails] Booking ${bookingId} not found in hotel ${hotelId}`);
            return null;
        }
        const bookingData = convertTimestampsToDates(bookingDoc.data());
        return JSON.parse(JSON.stringify(bookingData));
    } catch (error) {
        console.error(`[Action: getBookingDetails] Error fetching booking ${bookingId}:`, error);
        return null;
    }
}


// Function for guest to submit their completed booking form
export async function submitGuestBooking(linkId: string, formData: any) {
  console.log(`[Action: submitGuestBooking] START for linkId: ${linkId}`);
  const { db: adminDb } = getFirebaseAdmin();
  if (!adminDb) {
    console.error("[Action: submitGuestBooking] Firestore not initialized.");
    return { success: false, message: 'Server configuration error.' };
  }
  
  const guestLinkRef = adminDb.collection('guestLinks').doc(linkId);

  try {
    const linkDoc = await guestLinkRef.get();
    if (!linkDoc.exists) {
      console.warn(`[Action: submitGuestBooking] Invalid linkId provided: ${linkId}`);
      return { success: false, message: 'This booking link is invalid or has expired.' };
    }
    
    const linkData = linkDoc.data();
    if (linkData?.isCompleted) {
       console.warn(`[Action: submitGuestBooking] Booking already completed for linkId: ${linkId}`);
       return { success: false, message: 'This booking has already been completed.' };
    }

    // Securely get hotelId and bookingId from the trusted server-side document
    const { hotelId, bookingId } = linkData as { hotelId: string; bookingId: string; };

    const hotelRef = adminDb.collection('hotels').doc(hotelId);
    const bookingRef = hotelRef.collection('bookings').doc(bookingId);
    
    console.log(`[Action: submitGuestBooking] Verified Paths. Hotel: ${hotelRef.path}, Booking: ${bookingRef.path}`);

    const hotelDoc = await hotelRef.get();
    const bookingDoc = await bookingRef.get();

    if (!hotelDoc.exists || !bookingDoc.exists) {
        console.error(`[Action: submitGuestBooking] Mismatch: Hotel or Booking not found. Hotel exists: ${hotelDoc.exists}, Booking exists: ${bookingDoc.exists}`);
        return { success: false, message: 'Could not find the associated hotel or booking.' };
    }

    const hotelData = hotelDoc.data();
    const bookingData = convertTimestampsToDates(bookingDoc.data());
    
    if (!bookingData) {
        return { success: false, message: 'Booking data is missing.' };
    }

    // Prepare data to update
    const guestData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
    };
    
    const bookingUpdateData = {
        status: 'confirmed',
        guestDetails: guestData,
        documentUrl: formData.documentUrl || '',
        paymentProofUrl: formData.paymentProofUrl || '',
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    // Update documents in a batch
    const batch = adminDb.batch();
    batch.update(bookingRef, bookingUpdateData);
    batch.update(guestLinkRef, { isCompleted: true, completedAt: FieldValue.serverTimestamp() });
    await batch.commit();

    console.log(`[Action: submitGuestBooking] SUCCESS. Booking ${bookingId} confirmed.`);

    // --- AI Email Generation ---
    const emailInput = {
      guestName: `${formData.firstName} ${formData.lastName}`,
      hotelName: hotelData?.name || 'Your Hotel',
      checkInDate: format(bookingData.checkInDate, 'PPP'),
      checkOutDate: format(bookingData.checkOutDate, 'PPP'),
      bookingDetails: `1x ${bookingData.roomType}`,
    };
  
    try {
      const emailResult = await generateConfirmationEmail(emailInput);
      await sendEmail({ 
        to: formData.email, 
        subject: `Your Booking at ${hotelData?.name} is Confirmed!`, 
        html: emailResult.htmlContent 
      });
      console.log(`[Action: submitGuestBooking] Confirmation email dispatch simulated for ${formData.email}.`);
    } catch (error) {
      console.error("[Action: submitGuestBooking] Failed to generate or send email:", error);
      // Don't fail the whole process if email fails, just log it.
    }

    return { success: true, message: 'Booking completed successfully!' };

  } catch (error) {
    console.error(`[Action: submitGuestBooking] FATAL ERROR for linkId ${linkId}:`, error);
    return { success: false, message: 'An unexpected error occurred while submitting your booking.' };
  }
}

// Function to get initial booking data for the guest form
export async function getBookingDataForGuest(linkId: string) {
    console.log(`[Action: getBookingDataForGuest] START for linkId: ${linkId}`);
    const { db: adminDb } = getFirebaseAdmin();
    if (!adminDb) {
        return { success: false, message: 'Server configuration error.' };
    }
    
    const guestLinkRef = adminDb.collection('guestLinks').doc(linkId);
    
    try {
        const linkDoc = await guestLinkRef.get();

        if (!linkDoc.exists) {
            console.warn(`[Action: getBookingDataForGuest] Invalid linkId: ${linkId}`);
            return { success: false, message: 'This booking link is invalid or has expired.' };
        }

        const linkData = linkDoc.data() as { hotelId: string, bookingId: string, isCompleted: boolean };

        if (linkData.isCompleted) {
            console.warn(`[Action: getBookingDataForGuest] Booking already completed for linkId: ${linkId}`);
            return { success: false, message: 'This booking has already been completed.' };
        }

        const hotelDoc = await adminDb.collection('hotels').doc(linkData.hotelId).get();
        // Correct path using hotelId from the trusted linkData
        const bookingDoc = await adminDb.collection('hotels').doc(linkData.hotelId).collection('bookings').doc(linkData.bookingId).get();
        
        if (!hotelDoc.exists || !bookingDoc.exists) {
            console.error(`[Action: getBookingDataForGuest] Mismatch: Hotel or Booking not found. Hotel exists: ${hotelDoc.exists}, Booking exists: ${bookingDoc.exists}`);
            return { success: false, message: 'Could not find the associated hotel or booking information.' };
        }

        console.log(`[Action: getBookingDataForGuest] SUCCESS for linkId: ${linkId}`);
        const result = {
            success: true,
            data: {
                hotel: convertTimestampsToDates(hotelDoc.data()),
                booking: convertTimestampsToDates(bookingDoc.data()),
            }
        };
        // @ts-ignore
        return JSON.parse(JSON.stringify(result));

    } catch (error) {
        console.error(`[Action: getBookingDataForGuest] FATAL ERROR for linkId ${linkId}:`, error);
        return { success: false, message: 'An unexpected server error occurred.' };
    }
}
