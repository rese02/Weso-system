'use server';

import type { z } from 'zod';
import type { createBookingSchema } from '@/lib/definitions';
import { generateConfirmationEmail } from '@/ai/flows/generate-confirmation-email';
import { adminDb } from '@/lib/firebase-admin';
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


// Function to create a new booking and generate a guest link
export async function createBookingLink(hotelId: string, values: z.infer<typeof createBookingSchema>) {
  console.log(`[Action: createBookingLink] START for hotel ${hotelId}`, values);
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
        checkInDate: values.checkInDate,
        checkOutDate: values.checkOutDate,
        roomType: values.roomType,
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

// Placeholder to get bookings for a specific hotel
export async function getBookingsByHotel(hotelId: string) {
    console.log(`Fetching bookings for hotel ${hotelId}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (hotelId === 'hotel-sonnenalp') {
      return [
        { id: 'booking-101', guestName: 'Alice Johnson', checkIn: '2024-08-15', checkOut: '2024-08-20', status: 'confirmed', room: 'Deluxe Suite' },
        { id: 'booking-102', guestName: 'Bob Williams', checkIn: '2024-08-16', checkOut: '2024-08-18', status: 'pending_guest', room: 'Standard Room' },
        { id: 'booking-103', guestName: 'Charlie Brown', checkIn: '2024-09-01', checkOut: '2024-09-05', status: 'confirmed', room: 'Ocean View King' },
        { id: 'booking-104', guestName: 'Diana Prince', checkIn: '2024-09-10', checkOut: '2024-09-15', status: 'cancelled', room: 'Presidential Suite' },
      ]
    }
    
    return [];
}

// Placeholder to get details for a single booking
export async function getBookingDetails(bookingId: string) {
    console.log(`Fetching details for booking ${bookingId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
        id: bookingId,
        hotelId: 'hotel-sonnenalp',
        guestName: 'Alice Johnson',
        checkInDate: new Date('2024-08-15'),
        checkOutDate: new Date('2024-08-20'),
        roomType: 'Deluxe Suite',
        status: 'confirmed'
    }
}

// Function for guest to submit their completed booking form
export async function submitGuestBooking(linkId: string, formData: any) {
  console.log(`[Action: submitGuestBooking] START for linkId: ${linkId}`);
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
    if (!adminDb) {
        return { success: false, message: 'Server configuration error.' };
    }
    
    const guestLinkRef = adminDb.collection('guestLinks').doc(linkId);
    const linkDoc = await guestLinkRef.get();

    if (!linkDoc.exists) {
        return { success: false, message: 'Invalid booking link.' };
    }

    const linkData = linkDoc.data() as { hotelId: string, bookingId: string, isCompleted: boolean };

     if (linkData.isCompleted) {
       return { success: false, message: 'This booking has already been completed.' };
    }

    const hotelDoc = await adminDb.collection('hotels').doc(linkData.hotelId).get();
    const bookingDoc = await adminDb.collection('bookings').doc(linkData.bookingId).get();
    
    if (!hotelDoc.exists || !bookingDoc.exists) {
        return { success: false, message: 'Could not find hotel or booking.' };
    }

    return {
        success: true,
        data: {
            hotel: convertTimestampsToDates(hotelDoc.data()),
            booking: convertTimestampsToDates(bookingDoc.data()),
        }
    };
}
