
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
import { PlusCircle, MoreHorizontal, Trash2, CheckCircle, Clock, Eye, Copy, AlertCircle, CircleOff, Loader2, Bed } from 'lucide-react';
import { getBookingsByHotel } from '@/lib/actions/booking.actions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import type { Booking } from '@/lib/definitions';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function BookingsPage() {
  const params = useParams();
  const hotelId = params.hotelId as string;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();


  useEffect(() => {
    if (!hotelId) return;
    
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const fetchedBookings = await getBookingsByHotel(hotelId);
        setBookings(fetchedBookings);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Fehler beim Laden',
          description: 'Die Buchungen konnten nicht geladen werden.'
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBookings();
  }, [hotelId, toast]);


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
  
  const copyGuestLink = (guestLinkId: string) => {
    const link = `${window.location.origin}/guest/${guestLinkId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link kopiert!',
      description: 'Der Gast-Buchungslink wurde in die Zwischenablage kopiert.'
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Buchungsübersicht</h1>
          <p className="text-muted-foreground">Alle Buchungen für Ihr Hotel anzeigen und verwalten.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" disabled>
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
                <TableHead>Gast-Link</TableHead>
                <TableHead className="text-right pr-4">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-64 text-center">
                    <div className="flex flex-col justify-center items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span>Lade Buchungen...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <Bed className="h-12 w-12 text-muted-foreground" />
                        <h3 className="font-semibold">Noch keine Buchungen vorhanden</h3>
                        <p className="text-muted-foreground">Erstellen Sie Ihre erste Buchung, um loszulegen.</p>
                        <Button asChild>
                          <Link href={`/dashboard/${hotelId}/bookings/create-booking`}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Erste Buchung erstellen
                          </Link>
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => {
                  const statusInfo = getStatusInfo(booking.status);
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
                        <TableCell>{booking.updatedAt ? format(new Date(booking.updatedAt), 'dd.MM.yyyy, HH:mm') : format(new Date(booking.createdAt), 'dd.MM.yyyy, HH:mm')}</TableCell>
                        <TableCell>
                           <Button variant="outline" size="sm" onClick={() => copyGuestLink(booking.guestLinkId)}>
                                <Copy className="h-3 w-3 mr-2"/> Link kopieren
                            </Button>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                            <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <Link href={`/dashboard/${hotelId}/bookings/${booking.id}`}><Eye className="h-4 w-4" /></Link>
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
