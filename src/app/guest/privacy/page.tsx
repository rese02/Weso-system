import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full max-w-4xl p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h2>1. Introduction</h2>
          <p>
            Welcome to HotelHub Central. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
          </p>
          
          <h2>2. Information We Collect</h2>
          <p>
            We may collect personal information that you voluntarily provide to us when you complete a booking, such as your name, email address, phone number, and identification documents.
          </p>

          <h2>3. How We Use Your Information</h2>
          <p>
            Having accurate information permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you to:
          </p>
          <ul>
            <li>Process your booking and manage your reservation.</li>
            <li>Email you regarding your account or booking.</li>
            <li>Comply with legal and regulatory requirements.</li>
            <li>Fulfill and manage purchases, orders, payments, and other transactions related to the hotel stay.</li>
          </ul>

          <h2>4. Disclosure of Your Information</h2>
          <p>
            We do not share your personal information with third parties except as necessary to fulfill our services to you (e.g., sharing your details with the hotel you booked) or as required by law.
          </p>
          
          <h2>5. Security of Your Information</h2>
          <p>
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
          </p>

          <h2>6. Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please contact us at privacy@hotelhub.com.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
