import { BookingForm } from '@/components/booking/booking-form';

export default function GuestBookingPage({ params }: { params: { linkId: string } }) {
  return (
    <div className="flex w-full items-center justify-center p-4">
      <BookingForm linkId={params.linkId} />
    </div>
  );
}
