'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Hotel, BedDouble, ChevronRight, Loader2 } from 'lucide-react';
import { getHotels } from '@/lib/actions/hotel.actions';
import type { Hotel as HotelType } from '@/lib/definitions';

// Extend the HotelType to include the properties we expect from getHotels
interface DisplayHotel extends HotelType {
  bookings: number;
}


export default function AdminDashboardPage() {
  const [hotels, setHotels] = useState<DisplayHotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHotels() {
      setIsLoading(true);
      const fetchedHotels = await getHotels();
      // @ts-ignore
      setHotels(fetchedHotels);
      setIsLoading(false);
    }
    fetchHotels();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Verwaltete Hotels</h1>
          <p className="text-muted-foreground">Verwalten und überblicken Sie alle Hotelobjekte von hier aus.</p>
        </div>
        <Button asChild>
          <Link href="/admin/create-hotel">
            <PlusCircle className="mr-2 h-5 w-5" />
            Neues Hotel erstellen
          </Link>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        hotels.length === 0 ? (
          <Card className="text-center p-8">
            <CardHeader>
              <CardTitle>Noch keine Hotels vorhanden</CardTitle>
              <CardDescription>Erstellen Sie Ihr erstes Hotel, um mit der Verwaltung zu beginnen.</CardDescription>
            </CardHeader>
            <CardContent>
               <Button asChild>
                  <Link href="/admin/create-hotel">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Erstes Hotel erstellen
                  </Link>
                </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {hotels.map((hotel) => (
              <Card key={hotel.id} className="transform transition-transform hover:scale-105 hover:shadow-xl flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-medium font-headline truncate" title={hotel.name}>{hotel.name}</CardTitle>
                    <CardDescription>{hotel.city || 'N/A'}, {hotel.country || 'N/A'}</CardDescription>
                  </div>
                  <Hotel className="h-6 w-6 text-primary flex-shrink-0" />
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                   <div className="text-2xl font-bold pt-2 flex items-center gap-2">
                      <BedDouble className="h-6 w-6 text-muted-foreground" />
                      <span>{hotel.bookings} Buchungen</span>
                    </div>
                  <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                    <Link href={`/dashboard/${hotel.id}`}>
                      Hotel verwalten
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
