import { z } from 'zod';
import { type Timestamp } from 'firebase-admin/firestore';

// Base types
export type Hotel = {
  id: string;
  name: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  domain: string;
  bookings?: number; // Optional for display purposes
  status?: 'active' | 'inactive'; // Optional for display purposes
};

export type Guest = {
  id:string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type Booking = {
  id: string;
  hotelId: string;
  guestId?: string;
  guestName: string;
  checkInDate: Date | Timestamp;
  checkOutDate: Date | Timestamp;
  roomType: string;
  status: 'pending_guest' | 'confirmed' | 'cancelled' | 'archived';
  guestLinkId: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  guestDetails?: Guest;
};

export type GuestLink = {
    id: string;
    bookingId: string;
    hotelId: string;
    isCompleted: boolean;
    createdAt: Date;
    expiresAt?: Date;
};

export type BookingDataForGuest = {
    hotel: Hotel;
    booking: Booking;
}

// Zod Schemas for validation
export const createHotelSchema = z.object({
  // Section A
  hotelName: z.string().min(3, { message: 'Hotelname muss mindestens 3 Zeichen lang sein.' }),
  domain: z.string().optional(),
  logo: z.any().optional(), // In a real app, you'd use z.instanceof(File) or similar
  hotelierEmail: z.string().email({ message: "Ungültige E-Mail-Adresse." }),
  hotelierPassword: z.string().min(8, { message: 'Passwort muss mindestens 8 Zeichen lang sein.' }),
  
  // Section B
  contactEmail: z.string().email({ message: "Ungültige Kontakt-E-Mail-Adresse." }),
  contactPhone: z.string(),
  fullAddress: z.string().min(10, { message: "Vollständige Adresse ist erforderlich." }),

  // Section C
  meals: z.array(z.string()),
  roomCategories: z.array(z.object({ name: z.string().min(2, {message: 'Kategoriename erforderlich'}) })).min(1, "Mindestens eine Zimmerkategorie ist erforderlich."),

  // Section D
  bankAccountHolder: z.string(),
  iban: z.string(),
  bic: z.string(),
  bankName: z.string(),
});

export const hotelLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export const agencyLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});


export const securityAdvisorSchema = z.object({
  hotelName: z.string().min(1, "Hotel Name is required"),
  hotelDescription: z.string().min(1, "Hotel Description is required"),
  existingSecurityMeasures: z.string().min(1, "Existing Security Measures are required"),
  potentialThreats: z.string().min(1, "Potential Threats are required"),
});

export const createBookingSchema = z.object({
  guestName: z.string().min(2, { message: "Guest name is required." }),
  checkInDate: z.date({ required_error: "Check-in date is required." }),
  checkOutDate: z.date({ required_error: "Check-out date is required." }),
  roomType: z.string().min(3, { message: "Room type is required." }),
}).refine(data => data.checkInDate < data.checkOutDate, {
  message: "Check-out date must be after check-in date.",
  path: ["checkOutDate"],
});


// Guest booking multi-step form schemas
export const guestDetailsSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
});

export const documentUploadSchema = z.object({
    documentUrl: z.string().url("A valid document URL is required.").optional().or(z.literal('')),
});

export const paymentProofSchema = z.object({
    paymentProofUrl: z.string().url("A valid payment proof URL is required.").optional().or(z.literal('')),
});
