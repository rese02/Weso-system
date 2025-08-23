import { getBookingDetails } from '@/lib/actions/booking.actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Calendar, BedDouble, Hash, Pen, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Booking } from '@/lib/definitions';

export default async function BookingDetailsPage({ params }: { params: { hotelId: string, bookingId: string } }) {
  const bookingData = await getBookingDetails(params.bookingId, params.hotelId);
  const booking: Booking | null = bookingData ? {
      ...bookingData,
      checkInDate: new Date(bookingData.checkInDate),
      checkOutDate: new Date(bookingData.checkOutDate),
  } as Booking : null;


  if (!booking) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Error</CardTitle>
                  <CardDescription>Could not find booking with ID: {params.bookingId}</CardDescription>
              </CardHeader>
          </Card>
      );
  }
  
  const guestFullName = booking.guestDetails ? `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}` : booking.guestName;


  return (
    <div className="max-w-4xl mx-auto space-y-8">
       <div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Booking Details</h1>
        <p className="text-muted-foreground">Detailed information for booking #{booking.id.substring(0,6).toUpperCase()}.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="font-headline text-2xl">Booking for {guestFullName}</CardTitle>
                <CardDescription>
                    Status: <Badge className="capitalize ml-1">{booking.status.replace('_', ' ')}</Badge>
                </CardDescription>
            </div>
            <Button asChild variant="outline">
                <Link href={`/dashboard/${params.hotelId}/bookings/${booking.id}/edit`}>
                    <Pen className="mr-2 h-4 w-4" />
                    Edit
                </Link>
            </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="text-muted-foreground">Guest</p>
                <p className="font-semibold">{guestFullName}</p>
              </div>
            </div>
             <div className="flex items-center gap-3">
              <Hash className="h-5 w-5 text-primary" />
              <div>
                <p className="text-muted-foreground">Booking ID</p>
                <p className="font-semibold font-code">{booking.id}</p>
              </div>
            </div>
            {booking.guestDetails?.email && (<div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-semibold">{booking.guestDetails.email}</p>
              </div>
            </div>)}
             {booking.guestDetails?.phone && (<div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-semibold">{booking.guestDetails.phone}</p>
              </div>
            </div>)}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-muted-foreground">Check-in Date</p>
                <p className="font-semibold">{format(booking.checkInDate, "PPP")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-muted-foreground">Check-out Date</p>
                <p className="font-semibold">{format(booking.checkOutDate, "PPP")}</p>
              </div>
            </div>
             <div className="flex items-center gap-3">
              <BedDouble className="h-5 w-5 text-primary" />
              <div>
                <p className="text-muted-foreground">Room Type</p>
                <p className="font-semibold">{booking.roomType}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
