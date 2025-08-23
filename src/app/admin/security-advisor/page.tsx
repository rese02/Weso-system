
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { securityAdvisorSchema } from '@/lib/definitions';
import { generateSecurityPolicy } from '@/ai/flows/security-policy-advisor';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ShieldCheck, Wand2, Loader2 } from 'lucide-react';

type SecurityAdvisorFormValues = z.infer<typeof securityAdvisorSchema>;

export default function SecurityAdvisorPage() {
  const [recommendations, setRecommendations] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SecurityAdvisorFormValues>({
    resolver: zodResolver(securityAdvisorSchema),
    defaultValues: {
      hotelName: '',
      hotelDescription: '',
      existingSecurityMeasures: '',
      potentialThreats: '',
    },
  });

  const onSubmit = async (values: SecurityAdvisorFormValues) => {
    setIsLoading(true);
    setRecommendations('');
    try {
      const result = await generateSecurityPolicy(values);
      setRecommendations(result.policyRecommendations);
    } catch (error) {
      console.error(error);
      setRecommendations('An error occurred while generating the security policy. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary p-3 text-primary-foreground">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="font-headline text-2xl">AI Security Advisor</CardTitle>
              <CardDescription>Generate security policy recommendations for a hotel.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="hotelName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hotel Name</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. Hotel Adlon" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hotelDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hotel Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="z.B. Ein großes, abgelegenes Resorthotel in den Alpen..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="existingSecurityMeasures"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Existing Security Measures</FormLabel>
                    <FormControl>
                      <Textarea placeholder="z.B. Nachtwächter, begrenzte Videoüberwachung..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="potentialThreats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Potential Threats</FormLabel>
                    <FormControl>
                      <Textarea placeholder="z.B. Alleinlage, strenge Winterbedingungen, unbefugter Zutritt..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                {isLoading ? 'Generating...' : 'Generate Policy'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Generated Recommendations</CardTitle>
          <CardDescription>The AI-powered policy suggestions will appear below.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center h-full">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Analyzing data and crafting recommendations...</p>
            </div>
          )}
          {recommendations && (
             <div className="prose prose-sm max-w-none rounded-lg border bg-stone-50 p-4 whitespace-pre-wrap">
              {recommendations}
            </div>
          )}
          {!isLoading && !recommendations && (
             <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center h-full">
                <ShieldCheck className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">Your policy will be generated here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
