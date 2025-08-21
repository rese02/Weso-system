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
  name: z.string().min(3, { message: 'Hotel name must be at least 3 characters long.' }),
  address: z.string().min(5, { message: 'Address is required.' }),
  city: z.string().min(2, { message: 'City is required.' }),
  country: z.string().min(2, { message: 'Country is required.' }),
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
