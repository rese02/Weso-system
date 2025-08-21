'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { guestDetailsSchema, documentUploadSchema, paymentProofSchema } from '@/lib/definitions';
import { submitGuestBooking, getBookingDataForGuest } from '@/lib/actions/booking.actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { User, FileUp, CreditCard, PartyPopper, Loader2, AlertCircle, Hotel } from 'lucide-react';
import { format } from 'date-fns';

const steps = [
  { id: 1, title: 'Personal Details', icon: User, schema: guestDetailsSchema },
  { id: 2, title: 'Document Upload', icon: FileUp, schema: documentUploadSchema },
  { id: 3, title: 'Payment Proof', icon: CreditCard, schema: paymentProofSchema },
  { id: 4, title: 'Review & Submit', icon: PartyPopper, schema: z.object({}) },
];

type FormData = z.infer<typeof guestDetailsSchema> & 
                Partial<z.infer<typeof documentUploadSchema>> & 
                Partial<z.infer<typeof paymentProofSchema>>;

export function BookingForm({ linkId }: { linkId: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
      const result = await getBookingDataForGuest(linkId);
      if (result.success && result.data) {
        const guestNameParts = result.data.booking.guestName.split(' ');
        const initialFormData = {
            firstName: guestNameParts[0] || '',
            lastName: guestNameParts.slice(1).join(' ') || '',
            email: '',
            phone: '',
        };
        setFormData(initialFormData);
        setBookingDetails(result.data);
      } else {
        setError(result.message || 'Failed to load booking information.');
      }
      setIsLoading(false);
    };
    fetchInitialData();
  }, [linkId]);

  const form = useForm({
    resolver: zodResolver(steps[currentStep].schema),
    values: formData || { firstName: '', lastName: '', email: '', phone: '' },
    mode: 'onChange'
  });

  const processForm = (data: any) => {
    setFormData(prev => ({ ...prev!, ...data }));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };
  
  const handleSubmit = async () => {
    if (!formData) return;
    setIsSubmitting(true);
    const result = await submitGuestBooking(linkId, formData);
    setIsSubmitting(false);

    if (result.success) {
      router.push(`/guest/${linkId}/thank-you`);
    } else {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: result.message || "There was an error processing your booking. Please try again.",
      });
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl flex items-center justify-center p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4">Loading booking details...</p>
      </Card>
    );
  }

  if (error) {
     return (
      <Card className="w-full max-w-2xl p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <CardTitle className="mt-4 font-headline text-2xl">Error</CardTitle>
        <CardDescription className="mt-2">{error}</CardDescription>
      </Card>
    );
  }

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentStepIcon = steps[currentStep].icon;
  
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Hotel className="h-5 w-5" />
            <span>Booking for <strong>{bookingDetails.hotel.name}</strong></span>
        </div>
        <CardTitle className="font-headline text-2xl pt-2">Complete Your Booking</CardTitle>
        <CardDescription>Follow the steps below to finalize your reservation.</CardDescription>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center justify-center gap-2">
            <div className="rounded-full bg-primary p-3 text-primary-foreground">
                <CurrentStepIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">{steps[currentStep].title}</h3>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(processForm)} className="space-y-6">
            {currentStep === 0 && (
              <>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </>
            )}
             {currentStep === 1 && (
              <div className="text-center space-y-4 p-4 border-dashed border-2 rounded-lg">
                <FileUp className="mx-auto h-12 w-12 text-muted-foreground"/>
                <p className="text-muted-foreground">This is a placeholder for a document uploader. Click "Continue" to simulate upload.</p>
                <Button type="button" onClick={() => form.setValue('documentUrl', 'https://placehold.co/file.pdf', { shouldValidate: true })}>Simulate Upload</Button>
              </div>
            )}
            {currentStep === 2 && (
              <div className="text-center space-y-4 p-4 border-dashed border-2 rounded-lg">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground"/>
                <p className="text-muted-foreground">This is a placeholder for payment proof uploader. Click "Continue" to simulate upload.</p>
                <Button type="button" onClick={() => form.setValue('paymentProofUrl', 'https://placehold.co/payment.jpg', { shouldValidate: true })}>Simulate Upload</Button>
              </div>
            )}
            {currentStep === 3 && formData && (
                <div className="space-y-4 rounded-lg border bg-secondary p-4">
                    <h4 className="font-bold">Review Your Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><p><strong>Full Name:</strong> {formData.firstName} {formData.lastName}</p></div>
                        <div><p><strong>Email:</strong> {formData.email}</p></div>
                        <div><p><strong>Phone:</strong> {formData.phone}</p></div>
                        <div><p><strong>Check-in:</strong> {format(bookingDetails.booking.checkInDate.toDate(), 'PPP')}</p></div>
                        <div><p><strong>Check-out:</strong> {format(bookingDetails.booking.checkOutDate.toDate(), 'PPP')}</p></div>
                        <div><p><strong>Room:</strong> {bookingDetails.booking.roomType}</p></div>
                        <div><p><strong>Document:</strong> {formData.documentUrl ? 'Uploaded' : 'Not Uploaded'}</p></div>
                        <div><p><strong>Payment Proof:</strong> {formData.paymentProofUrl ? 'Uploaded' : 'Not Uploaded'}</p></div>
                    </div>
                    <p className="text-sm text-muted-foreground pt-4">By submitting, you agree to our terms and conditions.</p>
                </div>
            )}
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 0 || isSubmitting}>
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentStep === steps.length - 1 ? 'Submit Booking' : 'Continue'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
       <CardFooter>
            <p className="text-xs text-muted-foreground">Booking ID: {bookingDetails.booking.id}</p>
       </CardFooter>
    </Card>
  );
}
