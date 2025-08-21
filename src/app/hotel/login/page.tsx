'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Home, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { hotelLoginSchema } from '@/lib/definitions';
import { loginHotelier } from '@/lib/actions/auth.actions';

type LoginFormValues = z.infer<typeof hotelLoginSchema>;

export default function HotelierLoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(hotelLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const result = await loginHotelier(values);
    if (result.success && result.hotelId) {
      toast({
        title: 'Anmeldung erfolgreich!',
        description: 'Sie werden zum Dashboard weitergeleitet.',
      });
      router.push(`/dashboard/${result.hotelId}`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Anmeldung fehlgeschlagen',
        description: result.message || 'Bitte überprüfen Sie Ihre Anmeldedaten.',
      });
    }
  };


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
          <CardDescription>Willkommen zurück! Bitte melden Sie sich an.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail-Adresse</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="ihre@email.de" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full text-lg h-12 font-bold" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Anmelden...' : (
                    <>
                        <LogIn className="mr-2 h-5 w-5" />
                        Anmelden
                    </>
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            <Link href="/agency/login" className="text-primary hover:underline">
              Sind Sie ein Agentur-Admin? Hier anmelden.
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
