import Link from 'next/link';
import { Building } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AgencyLoginForm } from './agency-login-form';

export default function AgencyLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Building className="h-7 w-7" />
          </div>
          <CardTitle className="mt-4 font-headline text-3xl">Agency Login</CardTitle>
          <CardDescription>Administrator access for HotelHub Central.</CardDescription>
        </CardHeader>
        <CardContent>
          <AgencyLoginForm />
          <div className="mt-6 text-center text-sm">
            <Link href="/hotel/login" className="text-primary hover:underline">
              Are you a hotelier? Login here.
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
