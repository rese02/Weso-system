'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { hotelDirectBookingSchema } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { useParams, useRouter } from 'next/navigation';
import { createDirectBooking } from '@/lib/actions/booking.actions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, User, PlusCircle, Trash2, BedDouble } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDays, format } from 'date-fns';
import { DateRange } from 'react-day-picker';

type CreateBookingFormValues = z.infer<typeof hotelDirectBookingSchema>;

export default function CreateBookingPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const hotelId = params.hotelId as string;

  const form = useForm<CreateBookingFormValues>({
    resolver: zodResolver(hotelDirectBookingSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateRange: { from: new Date(), to: addDays(new Date(), 4) },
      mealPlan: 'none',
      totalPrice: '',
      language: 'de',
      rooms: [{ roomType: 'Standard', adults: 1, children: 0, toddlers: 0, childAges: '' }],
      internalNotes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rooms",
  });

  const onSubmit = async (values: CreateBookingFormValues) => {
    const result = await createDirectBooking(hotelId, values);
    if (result.success) {
        toast({
            title: "Buchung erfolgreich erstellt!",
            description: `Die Buchung für ${values.firstName} ${values.lastName} wurde angelegt.`,
        });
        router.push(`/dashboard/${hotelId}/bookings`);
    } else {
        toast({
            variant: "destructive",
            title: "Fehler beim Erstellen der Buchung",
            description: result.message || "Bitte versuchen Sie es erneut.",
        });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Neue Buchung erstellen</CardTitle>
        <CardDescription>Füllen Sie die folgenden Felder aus, um eine Buchung direkt im System anzulegen.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* --- Guest and Date Section --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><User size={16} /> Vorname</FormLabel>
                  <FormControl><Input placeholder="Vorname des Gastes" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><User size={16} /> Nachname</FormLabel>
                  <FormControl><Input placeholder="Nachname des Gastes" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField
                control={form.control}
                name="dateRange"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Zeitraum (Anreise - Abreise)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value.from && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value?.from ? (
                              field.value.to ? (
                                <>
                                  {format(field.value.from, "LLL dd, y")} -{" "}
                                  {format(field.value.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(field.value.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Zeitraum auswählen</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={field.value.from}
                          selected={{ from: field.value.from, to: field.value.to }}
                          onSelect={(range) => field.onChange(range as DateRange)}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* --- Pricing and Language Section --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="mealPlan" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Verpflegung</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Verpflegung auswählen" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="none">Keine</SelectItem>
                                <SelectItem value="breakfast">Frühstück</SelectItem>
                                <SelectItem value="half-board">Halbpension</SelectItem>
                                <SelectItem value="full-board">Vollpension</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="totalPrice" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Gesamtpreis (€)</FormLabel>
                        <FormControl><Input type="number" placeholder="Preis in Euro" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="language" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Sprache für Gastformular</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl><SelectTrigger><SelectValue placeholder="Sprache auswählen" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="de">Deutsch</SelectItem>
                                <SelectItem value="en">Englisch</SelectItem>
                                <SelectItem value="it">Italienisch</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            {/* --- Room Details Section --- */}
            <div className="space-y-6">
              {fields.map((field, index) => (
                <Card key={field.id} className="bg-secondary/50">
                   <CardHeader className="py-4">
                     <div className="flex items-center justify-between">
                       <CardTitle className="text-lg flex items-center gap-2"><BedDouble size={20}/> Zimmer {index + 1} Details</CardTitle>
                       {index > 0 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                       )}
                     </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    <FormField control={form.control} name={`rooms.${index}.roomType`} render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Zimmertyp</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Zimmertyp" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Standard">Standard</SelectItem>
                                <SelectItem value="Einzelzimmer">Einzelzimmer</SelectItem>
                                <SelectItem value="Doppelzimmer">Doppelzimmer</SelectItem>
                                <SelectItem value="Suite">Suite</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name={`rooms.${index}.adults`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Erwachsene</FormLabel>
                        <FormControl><Input type="number" min={1} {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name={`rooms.${index}.children`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kinder (3+)</FormLabel>
                        <FormControl><Input type="number" min={0} {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={form.control} name={`rooms.${index}.toddlers`} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kleinkinder</FormLabel>
                        <FormControl><Input type="number" min={0} {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="sm:col-span-2 md:col-span-5">
                       <FormField control={form.control} name={`rooms.${index}.childAges`} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Alter Kinder (3+)</FormLabel>
                            <FormControl><Input placeholder="z.B. 4, 8, 12" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )} />
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button type="button" variant="outline" onClick={() => append({ roomType: 'Standard', adults: 1, children: 0, toddlers: 0, childAges: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Weiteres Zimmer hinzufügen
              </Button>
            </div>
            
            {/* --- Internal Notes Section --- */}
             <FormField control={form.control} name="internalNotes" render={({ field }) => (
              <FormItem>
                <FormLabel>Interne Bemerkungen (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Zusätzliche Informationen für das Hotelpersonal..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* --- Footer Buttons --- */}
            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Abbrechen
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {form.formState.isSubmitting ? 'Wird erstellt...' : 'Buchung erstellen'}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
