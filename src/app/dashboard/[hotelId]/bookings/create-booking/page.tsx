'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { createBookingSchema } from '@/lib/definitions';
import { createBookingLink } from '@/lib/actions/booking.actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, User, BedDouble, Link as LinkIcon, Clipboard, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type CreateBookingFormValues = z.infer<typeof createBookingSchema>;

export default function CreateBookingPage() {
  const { toast } = useToast();
  const params = useParams();
  const hotelId = params.hotelId as string;
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const form = useForm<CreateBookingFormValues>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      guestName: '',
      roomType: '',
    },
  });

  const onSubmit = async (values: CreateBookingFormValues) => {
    const result = await createBookingLink(hotelId, values);
    if (result.success && result.link) {
      const fullUrl = `${window.location.origin}${result.link}`;
      setGeneratedLink(fullUrl);
      toast({
        title: "Booking Link Created!",
        description: "Share this link with the guest to complete their booking.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create the booking link. Please try again.",
      });
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Create New Booking</CardTitle>
        <CardDescription>Enter initial details to generate a secure booking link for the guest.</CardDescription>
      </CardHeader>
      <CardContent>
        {!generatedLink ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="guestName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input placeholder="Max Mustermann" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="checkInDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Check-in Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="checkOutDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Check-out Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < (form.getValues('checkInDate') || new Date())}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="roomType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Type</FormLabel>
                    <FormControl>
                      <div className="relative">
                          <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input placeholder="z.B. Deluxe Suite" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                {form.formState.isSubmitting ? 'Generating...' : 'Generate Guest Link'}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="space-y-4 text-center">
              <div className="flex justify-center">
                  <div className="rounded-full bg-accent p-4 text-accent-foreground">
                      <Check className="h-10 w-10" />
                  </div>
              </div>
            <h3 className="text-2xl font-bold font-headline">Link Generated Successfully!</h3>
            <p className="text-muted-foreground">Share this secure link with the guest to complete their booking information.</p>
            <div className="flex w-full items-center space-x-2 rounded-lg border bg-secondary p-2">
              <LinkIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <Input type="text" value={generatedLink} readOnly className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0" />
              <Button size="icon" onClick={copyToClipboard} className="flex-shrink-0 bg-accent hover:bg-accent/90">
                {isCopied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={() => { form.reset(); setGeneratedLink(''); }}>Create Another Booking</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
