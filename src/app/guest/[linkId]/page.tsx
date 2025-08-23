import { BookingForm } from '@/components/booking/booking-form';
import { getBookingDataForGuest } from '@/lib/actions/booking.actions';
import { AlertCircle } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';

export default async function GuestBookingPage({ params }: { params: { linkId: string } }) {
  const result = await getBookingDataForGuest(params.linkId);

  if (!result.success || !result.data) {
     return (
        <div className="flex w-full items-center justify-center p-4">
            <Card className="w-full max-w-lg p-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                <CardTitle className="mt-4 font-headline text-2xl">Error</CardTitle>
                <CardDescription className="mt-2">{result.message || "Could not load booking details."}</CardDescription>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center p-4">
      <BookingForm linkId={params.linkId} initialData={result.data} />
    </div>
  );
}
