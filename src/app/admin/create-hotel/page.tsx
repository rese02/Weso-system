'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { createHotelSchema } from '@/lib/definitions';
import { createHotel } from '@/lib/actions/hotel.actions';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Hotel } from 'lucide-react';

type CreateHotelFormValues = z.infer<typeof createHotelSchema>;

export default function CreateHotelPage() {
  const { toast } = useToast();
  const form = useForm<CreateHotelFormValues>({
    resolver: zodResolver(createHotelSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      country: '',
    },
  });

  const onSubmit = async (values: CreateHotelFormValues) => {
    const result = await createHotel(values);
    if (result.success) {
      toast({
        title: "Hotel Created!",
        description: `${values.name} has been successfully added to the system.`,
      });
      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create the hotel. Please try again.",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
             <div className="rounded-full bg-primary p-3 text-primary-foreground">
              <Hotel className="h-6 w-6" />
            </div>
            <div>
                <CardTitle className="font-headline text-2xl">Create a New Hotel System</CardTitle>
                <CardDescription>Fill in the details to set up a new hotel on HotelHub Central.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hotel Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., The Grand Budapest Hotel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Alpine Way" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                        <Input placeholder="Zubrowka" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                        <Input placeholder="Republic of Zubrowka" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
               </div>
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                {form.formState.isSubmitting ? 'Creating...' : 'Create Hotel'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
