'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getBookingDetails } from '@/lib/actions/booking.actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Booking } from '@/lib/definitions';

const editBookingSchema = z.object({
  guestName: z.string().min(1, 'Guest name is required'),
  checkInDate: z.date(),
  checkOutDate: z.date(),
  roomType: z.string().min(1, 'Room type is required'),
});

type EditBookingFormValues = z.infer<typeof editBookingSchema>;

export default function EditBookingPage() {
  const params = useParams();
  const hotelId = params.hotelId as string;
  const bookingId = params.bookingId as string;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<EditBookingFormValues>({
    resolver: zodResolver(editBookingSchema),
  });

  useEffect(() => {
    if (!bookingId || !hotelId) return;

    async function fetchBooking() {
      setIsLoading(true);
      const bookingData = await getBookingDetails(bookingId, hotelId);
      if (bookingData) {
        const dataWithDates = {
            ...bookingData,
            checkInDate: new Date(bookingData.checkInDate),
            checkOutDate: new Date(bookingData.checkOutDate),
        }
        setBooking(dataWithDates as Booking);
        form.reset(dataWithDates);
      }
      setIsLoading(false);
    }
    fetchBooking();
  }, [bookingId, hotelId, form]);

  const onSubmit = (data: EditBookingFormValues) => {
    console.log('Submitting updated booking data:', data);
    // Here you would call an `updateBooking` server action
  };
  
  if (isLoading) {
      return (
        <Card>
            <CardContent className="p-6">
                 <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="ml-4">Loading booking details...</p>
                </div>
            </CardContent>
        </Card>
      )
  }

  if (!booking) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>Could not find booking with ID: {bookingId}</CardDescription>
            </CardHeader>
        </Card>
    );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Edit Booking #{booking.id.substring(0,6).toUpperCase()}</CardTitle>
        <CardDescription>Update the details for this booking below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="guestName">Guest Full Name</Label>
            <Input id="guestName" {...form.register('guestName')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Check-in Date</Label>
               <Popover>
                <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch("checkInDate") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("checkInDate") ? format(form.watch("checkInDate"), "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch("checkInDate")}
                    onSelect={(date) => form.setValue('checkInDate', date as Date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Check-out Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch("checkOutDate") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("checkOutDate") ? format(form.watch("checkOutDate"), "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch("checkOutDate")}
                    onSelect={(date) => form.setValue('checkOutDate', date as Date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="roomType">Room Type</Label>
            <Input id="roomType" {...form.register('roomType')} />
          </div>

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
