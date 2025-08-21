import { getBookingDetails } from '@/lib/actions/booking.actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Calendar, BedDouble, Hash, Pen } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function BookingDetailsPage({ params }: { params: { hotelId: string, bookingId: string } }) {
  const booking = await getBookingDetails(params.bookingId);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
       <div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Booking Details</h1>
        <p className="text-muted-foreground">Detailed information for booking #{booking.id}.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="font-headline text-2xl">Booking for {booking.guestName}</CardTitle>
                <CardDescription>
                    Status: <Badge className="capitalize ml-1">{booking.status}</Badge>
                </CardDescription>
            </div>
            <Button asChild variant="outline">
                <Link href={`/dashboard/${params.hotelId}/bookings/${params.bookingId}/edit`}>
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
                <p className="font-semibold">{booking.guestName}</p>
              </div>
            </div>
             <div className="flex items-center gap-3">
              <Hash className="h-5 w-5 text-primary" />
              <div>
                <p className="text-muted-foreground">Booking ID</p>
                <p className="font-semibold font-code">{booking.id}</p>
              </div>
            </div>
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
