import { BookingForm } from '@/components/booking/booking-form';

export default function GuestBookingPage({ params }: { params: { linkId: string } }) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <BookingForm linkId={params.linkId} />
    </main>
  );
}
