
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Hotel, Loader2, MoreHorizontal, ChevronRight, Settings } from 'lucide-react';
import { getHotels } from '@/lib/actions/hotel.actions';
import type { Hotel as HotelType } from '@/lib/definitions';

// Extend the HotelType to include the properties we expect from getHotels
interface DisplayHotel extends HotelType {
  id: string;
  name: string;
  domain: string;
  bookings: number;
  status: 'active' | 'inactive';
}


export default function AdminDashboardPage() {
  const [hotels, setHotels] = useState<DisplayHotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHotels() {
      setIsLoading(true);
      try {
        const fetchedHotels = await getHotels();
        // The fetchedHotels are already in the correct format, but we cast to be safe
        setHotels(fetchedHotels as DisplayHotel[]);
      } catch (error) {
        console.error("Failed to fetch hotels:", error);
        // Handle error appropriately, maybe show a toast
      } finally {
        setIsLoading(false);
      }
    }
    fetchHotels();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Verwaltete Hotels</h1>
          <p className="text-muted-foreground">Verwalten und überblicken Sie alle Hotelobjekte von hier aus.</p>
        </div>
        <Button asChild className="h-12 px-6">
          <Link href="/admin/create-hotel">
            <PlusCircle className="mr-2 h-5 w-5" />
            Neues Hotel erstellen
          </Link>
        </Button>
      </div>
      
      {isLoading ? (
        <Card className="w-full">
            <CardContent className="p-6">
                 <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            </CardContent>
        </Card>
      ) : hotels.length === 0 ? (
          <Card className="w-full text-center p-8 border-dashed">
            <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary">
                    <Hotel className="h-8 w-8" />
                </div>
              <CardTitle className="mt-4">Noch keine Hotels vorhanden</CardTitle>
              <CardDescription>Erstellen Sie Ihr erstes Hotel, um mit der Verwaltung zu beginnen.</CardDescription>
            </CardHeader>
            <CardContent>
               <Button asChild className="h-12 px-6">
                  <Link href="/admin/create-hotel">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Erstes Hotel erstellen
                  </Link>
                </Button>
            </CardContent>
          </Card>
      ) : (
        <Card className="w-full">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Hotelname</TableHead>
                        <TableHead className="hidden sm:table-cell">Domain</TableHead>
                        <TableHead className="hidden md:table-cell">Buchungen</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {hotels.map((hotel) => (
                        <TableRow key={hotel.id}>
                            <TableCell className="font-medium">{hotel.name}</TableCell>
                            <TableCell className="text-muted-foreground hidden sm:table-cell">{hotel.domain}</TableCell>
                            <TableCell className="hidden md:table-cell">{hotel.bookings}</TableCell>
                            <TableCell>
                                <Badge variant={hotel.status === 'active' ? 'default' : 'secondary'} className={hotel.status === 'active' ? 'bg-green-100 text-green-800' : ''}>
                                    {hotel.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 w-9 p-0">
                                    <span className="sr-only">Menü öffnen</span>
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/dashboard/${hotel.id}`}>
                                            <ChevronRight className="mr-2 h-4 w-4" />
                                            <span>Verwalten</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/dashboard/${hotel.id}/settings`}>
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Einstellungen</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
