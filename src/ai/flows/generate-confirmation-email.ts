'use server';

/**
 * @fileOverview An AI agent to generate personalized and well-formatted HTML email confirmations for bookings.
 *
 * - generateConfirmationEmail - A function that handles the email confirmation generation process.
 * - GenerateConfirmationEmailInput - The input type for the generateConfirmationEmail function.
 * - GenerateConfirmationEmailOutput - The return type for the generateConfirmationEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateConfirmationEmailInputSchema = z.object({
  guestName: z.string().describe('The name of the guest.'),
  hotelName: z.string().describe('The name of the hotel.'),
  checkInDate: z.string().describe('The check-in date.'),
  checkOutDate: z.string().describe('The check-out date.'),
  bookingDetails: z.string().describe('Additional booking details.'),
});
export type GenerateConfirmationEmailInput = z.infer<typeof GenerateConfirmationEmailInputSchema>;

const GenerateConfirmationEmailOutputSchema = z.object({
  htmlContent: z.string().describe('The generated HTML content for the confirmation email.'),
});
export type GenerateConfirmationEmailOutput = z.infer<typeof GenerateConfirmationEmailOutputSchema>;

export async function generateConfirmationEmail(
  input: GenerateConfirmationEmailInput
): Promise<GenerateConfirmationEmailOutput> {
  return generateConfirmationEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateConfirmationEmailPrompt',
  input: {schema: GenerateConfirmationEmailInputSchema},
  output: {schema: GenerateConfirmationEmailOutputSchema},
  prompt: `You are an expert email composer specializing in creating professional and informative booking confirmation emails for hotels.

You will use the following information to generate a personalized HTML email confirmation for the guest. Ensure the email is well-formatted and includes all necessary booking details.

Guest Name: {{{guestName}}}
Hotel Name: {{{hotelName}}}
Check-In Date: {{{checkInDate}}}
Check-Out Date: {{{checkOutDate}}}
Booking Details: {{{bookingDetails}}}

Generate the complete HTML content for the email, including the <html>, <head>, and <body> tags. Use modern HTML and CSS for styling to ensure a professional look and feel.`,
});

const generateConfirmationEmailFlow = ai.defineFlow(
  {
    name: 'generateConfirmationEmailFlow',
    inputSchema: GenerateConfirmationEmailInputSchema,
    outputSchema: GenerateConfirmationEmailOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
