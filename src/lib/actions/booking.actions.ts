'use server';

import type { z } from 'zod';
import type { createBookingSchema } from '@/lib/definitions';
import { generateConfirmationEmail } from '@/ai/flows/generate-confirmation-email';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Function to create a new booking and generate a guest link
export async function createBookingLink(hotelId: string, values: z.infer<typeof createBookingSchema>) {
  console.log(`Creating booking for hotel ${hotelId} with values:`, values);
  if (!adminDb) {
    console.error("Firestore not initialized.");
    return { success: false, message: 'Server configuration error.' };
  }

  try {
    const hotelRef = adminDb.collection('hotels').doc(hotelId);
    const bookingLinkRef = adminDb.collection('bookingLinkIndex').doc();
    const bookingRef = hotelRef.collection('bookings').doc();

    const bookingData = {
        id: bookingRef.id,
        hotelId: hotelId,
        guestName: values.guestName,
        checkInDate: values.checkInDate,
        checkOutDate: values.checkOutDate,
        roomType: values.roomType,
        status: 'pending',
        guestLinkId: bookingLinkRef.id,
        createdAt: FieldValue.serverTimestamp(),
    };

    const bookingLinkData = {
        hotelId: hotelId,
    };
    
    const guestLinkData = {
        id: bookingLinkRef.id,
        bookingId: bookingRef.id,
        hotelId: hotelId,
        isCompleted: false,
        createdAt: FieldValue.serverTimestamp(),
        // expiresAt can also be set here
    }

    // Use a batch write to ensure atomicity
    const batch = adminDb.batch();
    batch.set(bookingRef, bookingData);
    batch.set(bookingLinkRef, bookingLinkData);
    batch.set(hotelRef.collection('guestLinks').doc(bookingLinkRef.id), guestLinkData);
    
    await batch.commit();

    return { success: true, message: 'Booking link created!', link: `/guest/${bookingLinkRef.id}` };
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
        { id: 'booking-102', guestName: 'Bob Williams', checkIn: '2024-08-16', checkOut: '2024-08-18', status: 'pending', room: 'Standard Room' },
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

// Placeholder for guest submitting their completed booking form
export async function submitGuestBooking(linkId: string, formData: any) {
  console.log(`Submitting form for link ${linkId} with data:`, formData);
  // 1. Validate linkId
  // 2. Update guest, booking, and guestLink documents in Firestore
  // 3. Call AI to generate confirmation email
  // 4. Send email
  
  const emailInput = {
    guestName: `${formData.firstName} ${formData.lastName}`,
    hotelName: 'The Grand Hotel', // This would be fetched from the DB
    checkInDate: 'August 15, 2024', // This would be fetched from the DB
    checkOutDate: 'August 20, 2024', // This would be fetched from the DB
    bookingDetails: '1x Deluxe Suite', // This would be fetched from the DB
  };
  
  try {
    const emailResult = await generateConfirmationEmail(emailInput);
    console.log('Generated Email HTML:', emailResult.htmlContent);
    // Here you would use an email sending service (e.g., SendGrid, Mailgun)
    // await sendEmail({ to: formData.email, subject: 'Booking Confirmation', html: emailResult.htmlContent });
    console.log('Simulating sending email...');
  } catch (error) {
    console.error("Failed to generate or send email:", error);
    return { success: false, message: 'Your booking was saved, but we failed to send a confirmation email.' };
  }
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, message: 'Booking completed successfully!' };
}
