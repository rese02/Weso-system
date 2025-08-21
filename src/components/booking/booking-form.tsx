'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { guestDetailsSchema, documentUploadSchema, paymentProofSchema } from '@/lib/definitions';
import { submitGuestBooking } from '@/lib/actions/booking.actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { User, FileUp, CreditCard, PartyPopper, Loader2 } from 'lucide-react';

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
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(steps[currentStep].schema),
    defaultValues: formData,
  });

  const processForm = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };
  
  const handleSubmit = async () => {
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

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentStepIcon = steps[currentStep].icon;
  
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Complete Your Booking</CardTitle>
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
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
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
                <Button type="button" onClick={() => form.setValue('documentUrl', 'https://placehold.co/file.pdf')}>Simulate Upload</Button>
              </div>
            )}
            {currentStep === 2 && (
              <div className="text-center space-y-4 p-4 border-dashed border-2 rounded-lg">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground"/>
                <p className="text-muted-foreground">This is a placeholder for payment proof uploader. Click "Continue" to simulate upload.</p>
                <Button type="button" onClick={() => form.setValue('paymentProofUrl', 'https://placehold.co/payment.jpg')}>Simulate Upload</Button>
              </div>
            )}
            {currentStep === 3 && (
                <div className="space-y-4 rounded-lg border bg-secondary p-4">
                    <h4 className="font-bold">Review Your Information</h4>
                    <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                    <p><strong>Email:</strong> {formData.email}</p>
                    <p><strong>Phone:</strong> {formData.phone}</p>
                    <p><strong>Document:</strong> {formData.documentUrl ? 'Uploaded' : 'Not Uploaded'}</p>
                    <p><strong>Payment Proof:</strong> {formData.paymentProofUrl ? 'Uploaded' : 'Not Uploaded'}</p>
                    <p className="text-sm text-muted-foreground">By submitting, you agree to our terms and conditions.</p>
                </div>
            )}
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 0}>
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentStep === steps.length - 1 ? 'Submit Booking' : 'Continue'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
