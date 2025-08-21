import { z } from 'zod';

// Base types
export type Hotel = {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  createdAt: Date;
};

export type Guest = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type Booking = {
  id: string;
  hotelId: string;
  guestId?: string;
  checkInDate: Date;
  checkOutDate: Date;
  roomType: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  guestLinkId: string;
  createdAt: Date;
};

export type GuestLink = {
    id: string;
    bookingId: string;
    hotelId: string;
    expiresAt: Date;
    isCompleted: boolean;
};

// Zod Schemas for validation
export const createHotelSchema = z.object({
  // Section A
  hotelName: z.string().min(3, { message: 'Hotelname muss mindestens 3 Zeichen lang sein.' }),
  domain: z.string().optional(),
  logo: z.any().optional(), // In a real app, you'd use z.instanceof(File) or similar
  hotelierEmail: z.string().email({ message: "Ungültige E-Mail-Adresse." }),
  hotelierPassword: z.string().min(8, { message: 'Passwort muss mindestens 8 Zeichen lang sein.' }),
  
  // Section B
  contactEmail: z.string().email({ message: "Ungültige Kontakt-E-Mail-Adresse." }).optional(),
  contactPhone: z.string().optional(),
  fullAddress: z.string().min(10, { message: "Vollständige Adresse ist erforderlich." }).optional(),

  // Section C
  meals: z.array(z.string()).optional(),
  roomCategories: z.array(z.object({ name: z.string().min(2, {message: 'Kategoriename erforderlich'}) })).min(1, "Mindestens eine Zimmerkategorie ist erforderlich."),

  // Section D
  bankAccountHolder: z.string().optional(),
  iban: z.string().optional(),
  bic: z.string().optional(),
  bankName: z.string().optional(),
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
    documentUrl: z.string().url("A valid document URL is required."),
});

export const paymentProofSchema = z.object({
    paymentProofUrl: z.string().url("A valid payment proof URL is required."),
});
