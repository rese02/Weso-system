
'use client';

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { createHotelSchema } from '@/lib/definitions';
import { createHotel } from '@/lib/actions/hotel.actions';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Hotel, Building, Upload, Mail, KeySquare, Phone, MapPin, Banknote, Trash2, PlusCircle, Wand2, Clipboard, Check, Loader2 } from 'lucide-react';

const mealOptions = [
  { id: 'Frühstück', label: 'Frühstück' },
  { id: 'Halbpension', label: 'Halbpension' },
  { id: 'Vollpension', label: 'Vollpension' },
  { id: 'keine', label: 'No Meal Plan' },
] as const;

type CreateHotelFormValues = z.infer<typeof createHotelSchema>;

export default function CreateHotelPage() {
  const { toast } = useToast();
  const [isEmailCopied, setIsEmailCopied] = useState(false);
  const [isPasswordCopied, setIsPasswordCopied] = useState(false);

  const form = useForm<CreateHotelFormValues>({
    resolver: zodResolver(createHotelSchema),
    defaultValues: {
      name: '',
      domain: '',
      logo: '',
      ownerEmail: '',
      hotelierPassword: '',
      contactEmail: '',
      contactPhone: '',
      contactAddress: '',
      roomCategories: ['Einzelzimmer', 'Doppelzimmer', 'Suite'],
      boardTypes: [],
      bankAccountHolder: '',
      bankIBAN: '',
      bankBIC: '',
      bankName: '',
      smtpUser: '',
      smtpPass: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "roomCategories",
  });

  const onSubmit = async (values: CreateHotelFormValues) => {
    // In a real app, the ownerId would come from the authenticated agency user's session
    const valuesWithOwner = { ...values, agencyId: 'agency_weso_systems', ownerUid: 'poLnjRLIPJfCrUcg8yMoKYz3ikl1' };
    
    const result = await createHotel(valuesWithOwner);
    if (result.success) {
      toast({
        title: "Hotel Created Successfully!",
        description: `${values.name} has been added to the system.`,
      });
      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message || "Could not create the hotel. Please try again.",
      });
    }
  };

  const generatePassword = () => {
    const newPassword = Math.random().toString(36).slice(-10);
    form.setValue('hotelierPassword', newPassword);
  };

  const copyToClipboard = (text: string, onCopy: () => void) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    onCopy();
  };
  
  const handleCopyEmail = () => {
    copyToClipboard(form.getValues('ownerEmail'), () => {
        setIsEmailCopied(true);
        setTimeout(() => setIsEmailCopied(false), 2000);
    });
  }

  const handleCopyPassword = () => {
    copyToClipboard(form.getValues('hotelierPassword'), () => {
        setIsPasswordCopied(true);
        setTimeout(() => setIsPasswordCopied(false), 2000);
    });
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary p-3 text-primary-foreground">
            <Hotel className="h-6 w-6" />
          </div>
          <div>
              <CardTitle className="font-headline text-2xl">Create New Hotel</CardTitle>
              <CardDescription>Set up a new hotel with all necessary configurations in HotelHub Central.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Section A: Basic Data / Access */}
            <div className="space-y-4">
              <h3 className="font-headline text-lg font-semibold flex items-center gap-2"><Building className="h-5 w-5 text-primary"/>Basic Data / Access</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Hotel Name</FormLabel><FormControl><Input placeholder="Your Hotel Name" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="domain" render={({ field }) => (
                  <FormItem><FormLabel>Domain or Subdomain</FormLabel><FormControl><Input placeholder="yourhotel.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="logo" render={({ field }) => (
                    <FormItem><FormLabel>Hotel Logo (PNG)</FormLabel>
                      <FormControl>
                          <div className="relative">
                              <Input type="file" accept=".png" className="pr-12" {...form.register("logo")} />
                              <Upload className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          </div>
                      </FormControl><FormMessage />
                  </FormItem>
                )} />
                  <FormField control={form.control} name="ownerEmail" render={({ field }) => (
                  <FormItem><FormLabel>Hotelier's Email Address</FormLabel>
                      <FormControl>
                          <div className="relative">
                              <Input type="email" placeholder="email@your-hotel.com" {...field} />
                              <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={handleCopyEmail}>
                                  {isEmailCopied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4"/>}
                              </Button>
                          </div>
                      </FormControl><FormMessage />
                  </FormItem>
                )} />
                  <FormField control={form.control} name="hotelierPassword" render={({ field }) => (
                  <FormItem><FormLabel>Hotelier's Password</FormLabel>
                      <FormControl>
                          <div className="relative">
                              <Input type="password" placeholder="Generated password" {...field} />
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={handleCopyPassword}>
                                      {isPasswordCopied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4"/>}
                                  </Button>
                                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={generatePassword}>
                                      <Wand2 className="h-4 w-4"/>
                                  </Button>
                              </div>
                          </div>
                      </FormControl><FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Section B: Public Contact Data */}
            <div className="space-y-4">
              <h3 className="font-headline text-lg font-semibold flex items-center gap-2"><Mail className="h-5 w-5 text-primary"/>Public Contact Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                <FormField control={form.control} name="contactEmail" render={({ field }) => (
                  <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input type="email" placeholder="contact@yourhotel.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contactPhone" render={({ field }) => (
                  <FormItem><FormLabel>Contact Phone Number</FormLabel><FormControl><Input placeholder="Your phone number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="md:col-span-2">
                  <FormField control={form.control} name="contactAddress" render={({ field }) => (
                      <FormItem><FormLabel>Full Address</FormLabel><FormControl><Input placeholder="Your full address" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>
            </div>

            {/* Section C: Booking Configuration */}
            <div className="space-y-4">
              <h3 className="font-headline text-lg font-semibold flex items-center gap-2"><KeySquare className="h-5 w-5 text-primary"/>Booking Configuration</h3>
              <div className="p-4 border rounded-lg space-y-6">
                  <div>
                      <FormLabel>Meal Plans</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      <FormField
                          control={form.control}
                          name="boardTypes"
                          render={() => (
                              mealOptions.map((item) => (
                              <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                  <Checkbox
                                      checked={form.watch('boardTypes').includes(item.id)}
                                      onCheckedChange={(checked) => {
                                      const currentMeals = form.getValues('boardTypes');
                                      if (checked) {
                                          form.setValue('boardTypes', [...currentMeals, item.id]);
                                      } else {
                                          form.setValue('boardTypes', currentMeals.filter((value) => value !== item.id));
                                      }
                                      }}
                                  />
                                  </FormControl>
                                  <FormLabel className="font-normal">{item.label}</FormLabel>
                              </FormItem>
                              ))
                          )}
                          />
                      </div>
                  </div>
                  <Separator/>
                  <div>
                      <FormLabel>Room Categories</FormLabel>
                      <div className="space-y-2 mt-2">
                          {fields.map((field, index) => (
                              <div key={field.id} className="flex items-center gap-2">
                              <FormField
                                  control={form.control}
                                  name={`roomCategories.${index}`}
                                  render={({ field }) => (
                                  <FormItem className="flex-grow">
                                      <FormControl><Input {...field} placeholder="e.g. Double Room" /></FormControl>
                                      <FormMessage />
                                  </FormItem>
                                  )}
                              />
                              <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                              </div>
                          ))}
                      </div>
                      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append('')}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Category
                      </Button>
                  </div>
              </div>
            </div>
            
            {/* Section D: Bank Details */}
            <div className="space-y-4">
              <h3 className="font-headline text-lg font-semibold flex items-center gap-2"><Banknote className="h-5 w-5 text-primary"/>Bank Details for Transfers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <FormField control={form.control} name="bankAccountHolder" render={({ field }) => (
                      <FormItem><FormLabel>Account Holder</FormLabel><FormControl><Input placeholder="Your name or company name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="bankName" render={({ field }) => (
                      <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="Name of your bank" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="bankIBAN" render={({ field }) => (
                      <FormItem><FormLabel>IBAN</FormLabel><FormControl><Input placeholder="Your IBAN" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="bankBIC" render={({ field }) => (
                      <FormItem><FormLabel>BIC / SWIFT</FormLabel><FormControl><Input placeholder="Your BIC/SWIFT" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
              </div>
            </div>
            
             {/* Section E: SMTP Details */}
            <div className="space-y-4">
              <h3 className="font-headline text-lg font-semibold flex items-center gap-2"><Mail className="h-5 w-5 text-primary"/>SMTP Details for Emailing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <FormField control={form.control} name="smtpUser" render={({ field }) => (
                      <FormItem><FormLabel>SMTP Username</FormLabel><FormControl><Input placeholder="e.g. your-email@gmail.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="smtpPass" render={({ field }) => (
                      <FormItem><FormLabel>SMTP Password</FormLabel><FormControl><Input type="password" placeholder="Your SMTP app password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
              </div>
            </div>

            <Separator />

            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full text-lg py-6">
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              {form.formState.isSubmitting ? 'Creating Hotel...' : 'Create Hotel and Setup System'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    