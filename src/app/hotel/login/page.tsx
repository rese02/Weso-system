'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HotelierLoginForm } from './hotelier-login-form';

export default function HotelierLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Home className="h-6 w-6" />
          </div>
          <CardTitle className="mt-4 font-headline text-3xl">Hotelier Login</CardTitle>
          <CardDescription>Welcome back! Please sign in to your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <HotelierLoginForm />
          <div className="mt-6 text-center text-sm">
            <Link href="/agency/login" className="text-primary hover:underline">
              Are you an agency administrator?
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
