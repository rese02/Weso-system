
'use server';

import type { z } from 'zod';
import type { Booking, hotelDirectBookingSchema, BookingDataForGuest, guestDetailsSchema } from '@/lib/definitions';
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

// Function to create a new booking from the hotelier dashboard directly
export async function createDirectBooking(hotelId: string, values: z.infer<typeof hotelDirectBookingSchema>) {
    console.log(`[Action: createDirectBooking] START for hotel ${hotelId}`, values);
    const { db: adminDb } = getFirebaseAdmin();

    try {
        const hotelRef = adminDb.collection('hotels').doc(hotelId);
        const bookingRef = adminDb.collection('bookings').doc();
        const guestLinkRef = adminDb.collection('guestLinks').doc();


        const bookingData = {
            id: bookingRef.id,
            hotelId: hotelId,
            guestName: `${values.firstName} ${values.lastName}`,
            checkInDate: Timestamp.fromDate(values.dateRange.from),
            checkOutDate: Timestamp.fromDate(values.dateRange.to),
            status: 'pending_guest', // Starts as pending until guest fills form
            guestLinkId: guestLinkRef.id,
            language: values.language,
            mealPlan: values.mealPlan,
            totalPrice: values.totalPrice,
            rooms: values.rooms,
            internalNotes: values.internalNotes,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        const guestLinkData = {
            id: guestLinkRef.id,
            bookingId: bookingRef.id,
            hotelId: hotelId,
            isCompleted: false,
            createdAt: FieldValue.serverTimestamp(),
        }

        const batch = adminDb.batch();
        batch.set(bookingRef, bookingData);
        batch.set(guestLinkRef, guestLinkData);
        await batch.commit();


        console.log(`[Action: createDirectBooking] SUCCESS. Booking ${bookingRef.id} created.`);
        return { success: true, message: 'Booking created successfully!', bookingId: bookingRef.id };
    } catch (error) {
        console.error("[Action: createDirectBooking] FATAL ERROR: ", error);
        return { success: false, message: 'Failed to create booking due to a server error.' };
    }
}

// Function to get bookings for a specific hotel
export async function getBookingsByHotel(hotelId: string): Promise<Booking[]> {
    console.log(`[Action: getBookingsByHotel] Fetching bookings for hotel ${hotelId}`);
    const { db: adminDb } = getFirebaseAdmin();

    try {
        const bookingsRef = adminDb.collection('bookings').where('hotelId', '==', hotelId);
        const snapshot = await bookingsRef.orderBy('createdAt', 'desc').get();
        
        if (snapshot.empty) {
            console.log(`[Action: getBookingsByHotel] No bookings found for hotel ${hotelId}`);
            return [];
        }
        
        const bookings = snapshot.docs.map(doc => convertTimestampsToDates(doc.data()) as Booking);
        console.log(`[Action: getBookingsByHotel] Found ${bookings.length} bookings for hotel ${hotelId}`);
        // Return a serializable version of the bookings
        return JSON.parse(JSON.stringify(bookings));

    } catch (error) {
        console.error(`[Action: getBookingsByHotel] Error fetching bookings for hotel ${hotelId}:`, error);
        return [];
    }
}

// Function to get details for a single booking
export async function getBookingDetails(bookingId: string): Promise<Booking | null> {
    console.log(`[Action: getBookingDetails] Fetching booking ${bookingId}`);
    const { db: adminDb } = getFirebaseAdmin();
    
    try {
        const bookingDoc = await adminDb.collection('bookings').doc(bookingId).get();
        if (!bookingDoc.exists) {
            console.warn(`[Action: getBookingDetails] Booking ${bookingId} not found`);
            return null;
        }
        const bookingData = convertTimestampsToDates(bookingDoc.data());
        console.log(`[Action: getBookingDetails] Successfully fetched booking ${bookingId}`);
        return JSON.parse(JSON.stringify(bookingData));
    } catch (error) {
        console.error(`[Action: getBookingDetails] Error fetching booking ${bookingId}:`, error);
        return null;
    }
}


// Function for guest to submit their completed booking form
export async function submitGuestBooking(linkId: string, formData: z.infer<typeof guestDetailsSchema>) {
  console.log(`[Action: submitGuestBooking] START for linkId: ${linkId}`);
  const { db: adminDb } = getFirebaseAdmin();
  
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

    const { hotelId, bookingId } = linkData as { hotelId: string; bookingId: string; };

    const hotelRef = adminDb.collection('hotels').doc(hotelId);
    const bookingRef = adminDb.collection('bookings').doc(bookingId);
    
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
        guestName: `${formData.firstName} ${formData.lastName}`, // Update guestName as well
        updatedAt: FieldValue.serverTimestamp(),
    };
    
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
      bookingDetails: `Booking for ${bookingData.rooms.length} room(s).`,
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
export async function getBookingDataForGuest(linkId: string): Promise<{ success: boolean; data?: BookingDataForGuest; message?: string }> {
    console.log(`[Action: getBookingDataForGuest] START for linkId: ${linkId}`);
    const { db: adminDb } = getFirebaseAdmin();
    
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
        const bookingDoc = await adminDb.collection('bookings').doc(linkData.bookingId).get();
        
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
        
        return JSON.parse(JSON.stringify(result));

    } catch (error) {
        console.error(`[Action: getBookingDataForGuest] FATAL ERROR for linkId ${linkId}:`, error);
        return { success: false, message: 'An unexpected server error occurred.' };
    }
}
