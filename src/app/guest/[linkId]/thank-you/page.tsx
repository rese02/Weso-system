import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function ThankYouPage() {
  return (
    <div className="flex w-full items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <CardTitle className="font-headline text-3xl mt-4">Thank You!</CardTitle>
          <CardDescription>Your booking information has been successfully submitted.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            A confirmation email with all your booking details has been sent to your email address. Please check your inbox (and spam folder, just in case).
          </p>
          <p className="text-sm text-muted-foreground">
            We look forward to welcoming you!
          </p>
          <Button asChild>
            <Link href="/">Return to Agency Portal</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
