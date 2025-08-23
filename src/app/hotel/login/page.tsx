'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HotelierLoginForm } from './hotelier-login-form';

export default function HotelierLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary/50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Home className="h-7 w-7" />
          </div>
          <CardTitle className="mt-4 font-headline text-3xl">Hotelier Login</CardTitle>
          <CardDescription>Welcome back! Please sign in to your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <HotelierLoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
