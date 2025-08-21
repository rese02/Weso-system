import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsAndConditionsPage() {
  return (
    <div className="w-full max-w-4xl p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Terms and Conditions</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h2>1. Agreement to Terms</h2>
          <p>
            By using our services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, you may not use our services.
          </p>
          
          <h2>2. Booking and Payment</h2>
          <p>
            All bookings are subject to availability. By providing your information through the guest portal, you authorize us to process your booking details. You are responsible for the accuracy of the information provided.
          </p>

          <h2>3. Cancellations and Refunds</h2>
          <p>
            Cancellation policies are specific to each hotel and will be communicated to you during the booking process. Please review the cancellation policy carefully.
          </p>

          <h2>4. User Responsibilities</h2>
          <p>
            You agree to provide accurate, current, and complete information during the booking process. You are responsible for maintaining the confidentiality of any booking links or information provided to you.
          </p>
          
          <h2>5. Limitation of Liability</h2>
          <p>
            In no event will HotelHub Central be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
          </p>

          <h2>6. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which the hotel is located, without regard to its conflict of law provisions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
