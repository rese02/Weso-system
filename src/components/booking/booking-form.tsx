'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { guestDetailsSchema, documentUploadSchema, paymentProofSchema } from '@/lib/definitions';
import { submitGuestBooking } from '@/lib/actions/booking.actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { BookingDataForGuest } from '@/lib/definitions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { User, FileUp, CreditCard, PartyPopper, Loader2, Hotel } from 'lucide-react';
import { format } from 'date-fns';

const steps = [
  { id: 0, title: 'Personal Details', icon: User, schema: guestDetailsSchema },
  { id: 1, title: 'Document Upload', icon: FileUp, schema: documentUploadSchema },
  { id: 2, title: 'Payment Proof', icon: CreditCard, schema: paymentProofSchema },
  { id: 3, title: 'Review & Submit', icon: PartyPopper, schema: z.object({}) },
];

type FormData = z.infer<typeof guestDetailsSchema> & 
                Partial<z.infer<typeof documentUploadSchema>> & 
                Partial<z.infer<typeof paymentProofSchema>>;

export function BookingForm({ linkId, initialData }: { linkId: string; initialData: BookingDataForGuest }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(() => {
    const guestNameParts = initialData.booking.guestName.split(' ');
    return {
        firstName: guestNameParts[0] || '',
        lastName: guestNameParts.slice(1).join(' ') || '',
        email: '',
        phone: '',
    };
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(steps[currentStep].schema),
    values: formData,
    mode: 'onChange'
  });
  
  // Watch for changes and update the main state
  const watchedValues = form.watch();
  useState(() => {
    setFormData(prev => ({ ...prev, ...watchedValues }));
  }, [watchedValues]);

  const processForm = (data: any) => {
    setFormData(prev => ({ ...prev!, ...data }));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit({ ...formData!, ...data });
    }
  };
  
  const handleSubmit = async (finalFormData: FormData) => {
    if (!finalFormData) return;
    setIsSubmitting(true);
    const result = await submitGuestBooking(linkId, finalFormData);
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

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentStepIcon = steps[currentStep].icon;
  
  return (
    <>
        <Card className="w-full max-w-2xl">
        <CardHeader>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Hotel className="h-5 w-5" />
                <span>Booking for <strong>{initialData.hotel.name}</strong></span>
            </div>
            <CardTitle className="font-headline text-2xl pt-2">Complete Your Booking</CardTitle>
            <CardDescription>Follow the steps below to finalize your reservation.</CardDescription>
            <div className="flex items-center gap-4 pt-4">
                <Progress value={progress} className="h-2" />
                <span className="text-sm font-semibold text-muted-foreground">{currentStep + 1} / {steps.length}</span>
            </div>
        </CardHeader>
        <CardContent>
            <div className="mb-6 flex items-center justify-center gap-3">
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
                {currentStep === 3 && formData && initialData.booking.checkInDate && (
                    <div className="space-y-4 rounded-lg border bg-secondary/50 p-4">
                        <h4 className="font-bold">Review Your Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><p><strong>Full Name:</strong> {formData.firstName} {formData.lastName}</p></div>
                            <div><p><strong>Email:</strong> {formData.email}</p></div>
                            <div><p><strong>Phone:</strong> {formData.phone}</p></div>
                            <div><p><strong>Check-in:</strong> {format(initialData.booking.checkInDate, 'PPP')}</p></div>
                            <div><p><strong>Check-out:</strong> {format(initialData.booking.checkOutDate, 'PPP')}</p></div>
                            <div><p><strong>Room:</strong> {initialData.booking.roomType}</p></div>
                            <div><p><strong>Document:</strong> {formData.documentUrl ? 'Uploaded' : 'Not Uploaded'}</p></div>
                            <div><p><strong>Payment Proof:</strong> {formData.paymentProofUrl ? 'Uploaded' : 'Not Uploaded'}</p></div>
                        </div>
                        <p className="text-sm text-muted-foreground pt-4">By submitting, you agree to our terms and conditions.</p>
                    </div>
                )}
            </form>
            </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 0 || isSubmitting}>
            Back
            </Button>
            <Button type="button" onClick={form.handleSubmit(processForm)} disabled={isSubmitting || !form.formState.isValid} className="h-12 px-8">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentStep === steps.length - 1 ? 'Submit Booking' : 'Continue'}
            </Button>
        </CardFooter>
        </Card>
    </>
  );
}
