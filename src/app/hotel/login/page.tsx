import Link from 'next/link';
import { Home } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HotelierLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary p-3 text-primary-foreground">
              <Home className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="font-headline text-3xl">Hotelier Dashboard</CardTitle>
          <CardDescription>Welcome back! Please sign in to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
             <Button asChild className="w-full text-lg h-12 font-bold">
              <Link href="/dashboard/hotel-001">Sign In</Link>
            </Button>
          </div>
          <div className="mt-6 text-center text-sm">
            <Link href="/agency/login" className="text-primary hover:underline">
              Are you an agency admin? Login here.
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
