'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { agencyLoginSchema } from '@/lib/definitions';
import { loginAgency } from '@/lib/actions/auth.actions';
import Link from 'next/link';

type LoginFormValues = z.infer<typeof agencyLoginSchema>;

export function AgencyLoginForm() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(agencyLoginSchema),
    defaultValues: {
      email: 'admin@weso.com',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    // This now uses Firebase Auth on the backend (via client SDK call for simplicity here)
    const result = await loginAgency(values);
    if (result.success) {
      toast({
        title: 'Login Successful!',
        description: 'Redirecting to the agency dashboard.',
      });
      router.push(`/admin`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: result.message || 'Please check your credentials.',
      });
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="admin@weso.com" {...field} />
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
              <div className="flex justify-between items-center">
                <FormLabel>Password</FormLabel>
                <Link href="/agency/forgot-password" passHref>
                  <span className="text-sm text-primary hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </Link>
              </div>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full text-lg h-12 font-bold" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Logging in...' : (
              <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Login
              </>
          )}
        </Button>
      </form>
    </Form>
  );
}
