'use server';

/**
 * @fileOverview Security Policy Advisor AI agent.
 *
 * - generateSecurityPolicy - A function that generates security policy recommendations based on hotel-specific data.
 * - SecurityPolicyAdvisorInput - The input type for the generateSecurityPolicy function.
 * - SecurityPolicyAdvisorOutput - The return type for the generateSecurityPolicy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SecurityPolicyAdvisorInputSchema = z.object({
  hotelName: z.string().describe('The name of the hotel.'),
  hotelDescription: z.string().describe('A description of the hotel, including its size, location, and type of clientele.'),
  existingSecurityMeasures: z.string().describe('A description of the existing security measures in place at the hotel.'),
  potentialThreats: z.string().describe('A description of potential security threats specific to the hotel.'),
});
export type SecurityPolicyAdvisorInput = z.infer<typeof SecurityPolicyAdvisorInputSchema>;

const SecurityPolicyAdvisorOutputSchema = z.object({
  policyRecommendations: z.string().describe('A list of security policy recommendations for the hotel.'),
});
export type SecurityPolicyAdvisorOutput = z.infer<typeof SecurityPolicyAdvisorOutputSchema>;

export async function generateSecurityPolicy(input: SecurityPolicyAdvisorInput): Promise<SecurityPolicyAdvisorOutput> {
  return securityPolicyAdvisorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'securityPolicyAdvisorPrompt',
  input: {schema: SecurityPolicyAdvisorInputSchema},
  output: {schema: SecurityPolicyAdvisorOutputSchema},
  prompt: `You are an expert security advisor specializing in hotel security policies.

You will use this information to generate security policy recommendations for the hotel.

Hotel Name: {{hotelName}}
Hotel Description: {{hotelDescription}}
Existing Security Measures: {{existingSecurityMeasures}}
Potential Threats: {{potentialThreats}}

Based on this information, provide a list of security policy recommendations for the hotel. Be specific and actionable.
`,
});

const securityPolicyAdvisorFlow = ai.defineFlow(
  {
    name: 'securityPolicyAdvisorFlow',
    inputSchema: SecurityPolicyAdvisorInputSchema,
    outputSchema: SecurityPolicyAdvisorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
