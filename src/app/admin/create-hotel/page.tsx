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
import { Hotel, Building, Upload, Mail, KeySquare, Phone, MapPin, Banknote, Trash2, PlusCircle, Wand2, Clipboard, Check } from 'lucide-react';

const mealOptions = [
  { id: 'breakfast', label: 'Frühstück' },
  { id: 'half_board', label: 'Halbpension' },
  { id: 'full_board', label: 'Vollpension' },
  { id: 'none', label: 'Ohne Verpflegung' },
] as const;

type CreateHotelFormValues = z.infer<typeof createHotelSchema>;

export default function CreateHotelPage() {
  const { toast } = useToast();
  const [isEmailCopied, setIsEmailCopied] = useState(false);
  const [isPasswordCopied, setIsPasswordCopied] = useState(false);

  const form = useForm<CreateHotelFormValues>({
    resolver: zodResolver(createHotelSchema),
    defaultValues: {
      hotelName: '',
      domain: '',
      logo: '',
      hotelierEmail: '',
      hotelierPassword: '',
      contactEmail: '',
      contactPhone: '',
      fullAddress: '',
      roomCategories: [{ name: 'Einzelzimmer' }, { name: 'Doppelzimmer' }, { name: 'Suite' }],
      meals: [],
      bankAccountHolder: '',
      iban: '',
      bic: '',
      bankName: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "roomCategories",
  });

  const onSubmit = async (values: CreateHotelFormValues) => {
    const result = await createHotel(values);
    if (result.success) {
      toast({
        title: "Hotel erfolgreich erstellt!",
        description: `${values.hotelName} wurde dem System hinzugefügt.`,
      });
      form.reset();
    } else {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Das Hotel konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
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
    copyToClipboard(form.getValues('hotelierEmail'), () => {
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
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
             <div className="rounded-full bg-primary p-3 text-primary-foreground">
              <Hotel className="h-6 w-6" />
            </div>
            <div>
                <CardTitle className="font-headline text-2xl">Neues Hotel Anlegen</CardTitle>
                <CardDescription>Richten Sie ein neues Hotel mit allen erforderlichen Konfigurationen in HotelHub Central ein.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Section A: Basic Data / Access */}
              <div className="space-y-4">
                <h3 className="font-headline text-lg font-semibold flex items-center gap-2"><Building className="h-5 w-5 text-primary"/>Grunddaten / Zugang</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <FormField control={form.control} name="hotelName" render={({ field }) => (
                    <FormItem><FormLabel>Hotelname</FormLabel><FormControl><Input placeholder="Residence La Pausa" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="domain" render={({ field }) => (
                    <FormItem><FormLabel>Domain oder Subdomain</FormLabel><FormControl><Input placeholder="hotel.example.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="logo" render={({ field }) => (
                     <FormItem><FormLabel>Hotel-Logo (PNG)</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input type="file" accept=".png" className="pr-12" {...form.register("logo")} />
                                <Upload className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            </div>
                        </FormControl><FormMessage />
                    </FormItem>
                  )} />
                   <FormField control={form.control} name="hotelierEmail" render={({ field }) => (
                    <FormItem><FormLabel>E-Mail-Adresse des Hoteliers</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input type="email" placeholder="info@residence-pausa.it" {...field} />
                                <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={handleCopyEmail}>
                                    {isEmailCopied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4"/>}
                                </Button>
                            </div>
                        </FormControl><FormMessage />
                    </FormItem>
                  )} />
                   <FormField control={form.control} name="hotelierPassword" render={({ field }) => (
                    <FormItem><FormLabel>Passwort des Hoteliers</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input type="password" placeholder="Passwort generieren..." {...field} />
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
                <h3 className="font-headline text-lg font-semibold flex items-center gap-2"><Mail className="h-5 w-5 text-primary"/>Öffentliche Kontaktdaten</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <FormField control={form.control} name="contactEmail" render={({ field }) => (
                    <FormItem><FormLabel>Kontakt E-Mail</FormLabel><FormControl><Input type="email" placeholder="kontakt@hotelname.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="contactPhone" render={({ field }) => (
                    <FormItem><FormLabel>Kontakt Telefonnummer</FormLabel><FormControl><Input placeholder="+39 0461 123456" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="md:col-span-2">
                    <FormField control={form.control} name="fullAddress" render={({ field }) => (
                        <FormItem><FormLabel>Vollständige Adresse</FormLabel><FormControl><Input placeholder="Via Dolomiti 12, 39048 Wolkenstein, Italien" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>
              </div>

              {/* Section C: Booking Configuration */}
              <div className="space-y-4">
                <h3 className="font-headline text-lg font-semibold flex items-center gap-2"><KeySquare className="h-5 w-5 text-primary"/>Buchungskonfiguration</h3>
                <div className="p-4 border rounded-lg space-y-6">
                    <div>
                        <FormLabel>Verpflegungsarten</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        <FormField
                            control={form.control}
                            name="meals"
                            render={() => (
                                mealOptions.map((item) => (
                                <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                    <Checkbox
                                        checked={form.watch('meals').includes(item.id)}
                                        onCheckedChange={(checked) => {
                                        const currentMeals = form.getValues('meals');
                                        if (checked) {
                                            form.setValue('meals', [...currentMeals, item.id]);
                                        } else {
                                            form.setValue('meals', currentMeals.filter((value) => value !== item.id));
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
                        <FormLabel>Zimmerkategorien</FormLabel>
                        <div className="space-y-2 mt-2">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-2">
                                <FormField
                                    control={form.control}
                                    name={`roomCategories.${index}.name`}
                                    render={({ field }) => (
                                    <FormItem className="flex-grow">
                                        <FormControl><Input {...field} placeholder="z.B. Doppelzimmer" /></FormControl>
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
                        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ name: '' })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Kategorie hinzufügen
                        </Button>
                    </div>
                </div>
              </div>
              
              {/* Section D: Bank Details */}
              <div className="space-y-4">
                <h3 className="font-headline text-lg font-semibold flex items-center gap-2"><Banknote className="h-5 w-5 text-primary"/>Bankverbindung für Überweisungen</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                    <FormField control={form.control} name="bankAccountHolder" render={({ field }) => (
                        <FormItem><FormLabel>Kontoinhaber</FormLabel><FormControl><Input placeholder="Residence La Pausa s.r.l." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="bankName" render={({ field }) => (
                        <FormItem><FormLabel>Bank (Name der Bank)</FormLabel><FormControl><Input placeholder="Banca Popolare di..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="iban" render={({ field }) => (
                        <FormItem><FormLabel>IBAN</FormLabel><FormControl><Input placeholder="IT60X0542811101000000123456" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="bic" render={({ field }) => (
                        <FormItem><FormLabel>BIC / SWIFT</FormLabel><FormControl><Input placeholder="BPPIITRRXXX" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
              </div>

              <Separator />

              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full text-lg py-6">
                {form.formState.isSubmitting ? 'Wird erstellt...' : 'Hotel anlegen und System einrichten'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
