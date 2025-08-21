'use server';

import type { z } from 'zod';
import type { createBookingSchema } from '@/lib/definitions';
import { generateConfirmationEmail } from '@/ai/flows/generate-confirmation-email';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendEmail } from './email.actions';
import { format } from 'date-fns';

// Function to create a new booking and generate a guest link
export async function createBookingLink(hotelId: string, values: z.infer<typeof createBookingSchema>) {
  console.log(`Creating booking for hotel ${hotelId} with values:`, values);
  if (!adminDb) {
    console.error("Firestore not initialized.");
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
        hotelId: hotelId,
        isCompleted: false,
        createdAt: FieldValue.serverTimestamp(),
        // expiresAt can also be set here
    }

    // Use a batch write to ensure atomicity
    const batch = adminDb.batch();
    batch.set(bookingRef, bookingData);
    batch.set(guestLinkRef, guestLinkData);
    
    await batch.commit();

    return { success: true, message: 'Booking link created!', link: `/guest/${guestLinkRef.id}` };
  } catch (error) {
    console.error("Error creating booking link: ", error);
    return { success: false, message: 'Failed to create booking link.' };
  }
}

// Placeholder to get bookings for a specific hotel
export async function getBookingsByHotel(hotelId: string) {
    console.log(`Fetching bookings for hotel ${hotelId}...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
        { id: 'booking-101', guestName: 'Alice Johnson', checkIn: '2024-08-15', checkOut: '2024-08-20', status: 'confirmed', room: 'Deluxe Suite' },
        { id: 'booking-102', guestName: 'Bob Williams', checkIn: '2024-08-16', checkOut: '2024-08-18', status: 'pending_guest', room: 'Standard Room' },
        { id: 'booking-103', guestName: 'Charlie Brown', checkIn: '2024-09-01', checkOut: '2024-09-05', status: 'confirmed', room: 'Ocean View King' },
        { id: 'booking-104', guestName: 'Diana Prince', checkIn: '2024-09-10', checkOut: '2024-09-15', status: 'cancelled', room: 'Presidential Suite' },
    ]
}

// Placeholder to get details for a single booking
export async function getBookingDetails(bookingId: string) {
    console.log(`Fetching details for booking ${bookingId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
        id: bookingId,
        hotelId: 'hotel-001',
        guestName: 'Alice Johnson',
        checkInDate: new Date('2024-08-15'),
        checkOutDate: new Date('2024-08-20'),
        roomType: 'Deluxe Suite',
        status: 'confirmed'
    }
}

// Function for guest to submit their completed booking form
export async function submitGuestBooking(linkId: string, formData: any) {
  console.log(`Submitting form for link ${linkId} with data:`, formData);
  if (!adminDb) {
    console.error("Firestore not initialized.");
    return { success: false, message: 'Server configuration error.' };
  }
  
  const guestLinkRef = adminDb.collection('guestLinks').doc(linkId);

  try {
    const linkDoc = await guestLinkRef.get();
    if (!linkDoc.exists) {
      return { success: false, message: 'This booking link is invalid or has expired.' };
    }
    
    const linkData = linkDoc.data();
    if (linkData?.isCompleted) {
       return { success: false, message: 'This booking has already been completed.' };
    }

    const { hotelId, bookingId } = linkData as { hotelId: string; bookingId: string; };

    const hotelRef = adminDb.collection('hotels').doc(hotelId);
    const bookingRef = hotelRef.collection('bookings').doc(bookingId);
    
    const hotelDoc = await hotelRef.get();
    const bookingDoc = await bookingRef.get();

    if (!hotelDoc.exists || !bookingDoc.exists) {
        return { success: false, message: 'Could not find the associated hotel or booking.' };
    }

    const hotelData = hotelDoc.data();
    const bookingData = bookingDoc.data();

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
    batch.update(guestLinkRef, { isCompleted: true });
    await batch.commit();

    // --- AI Email Generation ---
    const emailInput = {
      guestName: `${formData.firstName} ${formData.lastName}`,
      hotelName: hotelData?.name || 'Your Hotel',
      checkInDate: format(bookingData?.checkInDate.toDate(), 'PPP'),
      checkOutDate: format(bookingData?.checkOutDate.toDate(), 'PPP'),
      bookingDetails: `1x ${bookingData?.roomType}`,
    };
  
    try {
      const emailResult = await generateConfirmationEmail(emailInput);
      await sendEmail({ 
        to: formData.email, 
        subject: `Your Booking at ${hotelData?.name} is Confirmed!`, 
        html: emailResult.htmlContent 
      });
    } catch (error) {
      console.error("Failed to generate or send email:", error);
      // Don't fail the whole process if email fails, just log it.
    }

    return { success: true, message: 'Booking completed successfully!' };

  } catch (error) {
    console.error("Error submitting guest booking:", error);
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

    const { hotelId, bookingId, isCompleted } = linkDoc.data() as { hotelId: string, bookingId: string, isCompleted: boolean };

     if (isCompleted) {
       return { success: false, message: 'Booking already completed.' };
    }

    const hotelDoc = await adminDb.collection('hotels').doc(hotelId).get();
    const bookingDoc = await adminDb.collection('bookings').doc(bookingId).get();
    
    if (!hotelDoc.exists || !bookingDoc.exists) {
        return { success: false, message: 'Could not find hotel or booking.' };
    }

    return {
        success: true,
        data: {
            hotel: hotelDoc.data(),
            booking: bookingDoc.data(),
        }
    };
}
