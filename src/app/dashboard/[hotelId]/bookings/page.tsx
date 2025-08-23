'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Trash2, CheckCircle, Clock, Eye, Copy, AlertCircle, CircleOff, Loader2 } from 'lucide-react';
import { getBookingsByHotel } from '@/lib/actions/booking.actions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import type { Booking } from '@/lib/definitions';
import { useParams } from 'next/navigation';

export default function BookingsPage() {
  const params = useParams();
  const hotelId = params.hotelId as string;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    if (!hotelId) return;
    
    const fetchBookings = async () => {
      setIsLoading(true);
      const fetchedBookings = await getBookingsByHotel(hotelId);
      // @ts-ignore
      setBookings(fetchedBookings);
      setIsLoading(false);
    }
    
    fetchBookings();
  }, [hotelId]);


  const getStatusInfo = (status: string): { text: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode } => {
    switch (status) {
      case 'confirmed':
        return { text: 'Bestätigt', variant: 'default', icon: <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> };
      case 'pending_guest':
        return { text: 'Ausstehend', variant: 'secondary', icon: <Clock className="h-3.5 w-3.5 mr-1.5" /> };
      case 'cancelled':
        return { text: 'Storniert', variant: 'destructive', icon: <AlertCircle className="h-3.5 w-3.5 mr-1.5" /> };
      default:
        return { text: 'Unbekannt', variant: 'outline', icon: <CircleOff className="h-3.5 w-3.5 mr-1.5" /> };
    }
  };
  
   const getPaymentStatusInfo = (status: string): { text: string; icon: React.ReactNode } => {
    // This is a placeholder as payment status is not in the data model yet
    switch (status) {
      case 'confirmed': // Assuming 'confirmed' booking means partial payment
        return { text: 'Teilzahlung', icon: <Clock className="h-3.5 w-3.5 mr-1.5 text-yellow-600" /> };
      case 'pending_guest':
        return { text: 'Offen', icon: <Clock className="h-3.5 w-3.5 mr-1.5 text-red-600" /> };
      default:
        return { text: 'Offen', icon: <Clock className="h-3.5 w-3.5 mr-1.5 text-red-600" /> };
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Buchungsübersicht</h1>
          <p className="text-muted-foreground">Alle Buchungen für Ihr Hotel anzeigen und verwalten.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline">
                <Trash2 className="mr-2 h-4 w-4" />
                Löschen
            </Button>
            <Button asChild>
              <Link href={`/dashboard/${hotelId}/bookings/create-booking`}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Buchung erstellen
              </Link>
            </Button>
        </div>
      </div>

      <Card className="w-full">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] px-4"><Checkbox/></TableHead>
                <TableHead>Buchungs-ID</TableHead>
                <TableHead>Gast</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Letzte Änderung</TableHead>
                <TableHead>Zahlungsstatus</TableHead>
                <TableHead className="text-right pr-4">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">Loading bookings...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No bookings found.
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => {
                  const statusInfo = getStatusInfo(booking.status);
                  const paymentStatusInfo = getPaymentStatusInfo(booking.status);
                  return (
                    <TableRow key={booking.id}>
                        <TableCell className="px-4"><Checkbox/></TableCell>
                        <TableCell className="font-mono text-muted-foreground">{booking.id.substring(0, 6).toUpperCase()}</TableCell>
                        <TableCell className="font-medium">{booking.guestDetails ? `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}` : booking.guestName}</TableCell>
                        <TableCell>{format(new Date(booking.checkInDate), 'dd.MM.yyyy')}</TableCell>
                        <TableCell>{format(new Date(booking.checkOutDate), 'dd.MM.yyyy')}</TableCell>
                        <TableCell>
                            <Badge variant={statusInfo.variant} className={`flex items-center w-fit ${statusInfo.variant === 'default' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                                {statusInfo.icon}
                                <span>{statusInfo.text}</span>
                            </Badge>
                        </TableCell>
                        <TableCell>{booking.updatedAt ? format(new Date(booking.updatedAt), 'dd.MM.yyyy, HH:mm:ss') : 'N/A'}</TableCell>
                        <TableCell>
                             <Badge variant="outline" className="flex items-center w-fit bg-gray-100 text-gray-800 border-gray-200">
                                {paymentStatusInfo.icon}
                                <span>{paymentStatusInfo.text}</span>
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                            <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <Link href={`/dashboard/${hotelId}/bookings/${booking.id}`}><Eye className="h-4 w-4" /></Link>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <Link href={`/guest/${booking.guestLinkId}`} target="_blank" rel="noopener noreferrer"><Copy className="h-4 w-4" /></Link>
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Als bestätigt markieren</DropdownMenuItem>
                                        <DropdownMenuItem>Rechnung senden</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">Buchung stornieren</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
