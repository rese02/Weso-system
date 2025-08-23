'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getHotelDashboardData } from '@/lib/actions/hotel.actions';
import { 
    Euro, 
    Book, 
    BookCheck, 
    Clock, 
    PlusCircle, 
    List, 
    TrendingUp, 
    ShieldCheck, 
    Database, 
    Server, 
    Wrench,
    Loader2
} from 'lucide-react';

interface DashboardData {
    hotelName: string;
    stats: {
        totalRevenue: string;
        totalBookings: number;
        confirmedBookings: number;
        pendingActions: number;
    };
    recentActivities: {
        id: string;
        description: string;
        timestamp: string;
    }[];
}

export default function HotelDashboardPage({ params }: { params: { hotelId: string } }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        if (!params.hotelId) return;
        setIsLoading(true);
        const result = await getHotelDashboardData(params.hotelId);
        setData(result);
        setIsLoading(false);
    }
    fetchData();
  }, [params.hotelId]);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  if (!data) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>Could not load dashboard data.</CardDescription>
            </CardHeader>
        </Card>
    );
  }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Übersicht Ihrer {data.hotelName} Buchungsanwendung.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtumsatz</CardTitle>
            <Euro className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{data.stats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">Aus bestätigten Buchungen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtbuchungen</CardTitle>
            <Book className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">Alle Zeiten</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bestätigte Buchungen</CardTitle>
            <BookCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.confirmedBookings}</div>
            <p className="text-xs text-muted-foreground">Bereit zur Anreise</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ausstehende Aktionen</CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.pendingActions}</div>
            <p className="text-xs text-muted-foreground">Warten auf Gastdaten/Bestätigung</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Schnellaktionen</CardTitle>
                    <CardDescription>Führen Sie gängige Aufgaben schnell aus.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button size="lg" className="w-full justify-start bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                         <Link href={`/dashboard/${params.hotelId}/bookings/create-booking`}>
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Neue Buchung erstellen
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="w-full justify-start" asChild>
                        <Link href={`/dashboard/${params.hotelId}/bookings`}>
                            <List className="mr-2 h-5 w-5" />
                            Alle Buchungen anzeigen
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Letzte Aktivitäten
                    </CardTitle>
                    <CardDescription>Neueste Aktualisierungen und wichtige Ereignisse.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3 text-sm">
                        {data.recentActivities.length > 0 ? data.recentActivities.map(activity => (
                            <li key={activity.id} className="flex items-center gap-3">
                                <div className="text-muted-foreground font-mono text-xs">{activity.timestamp}</div>
                                <div className="flex-1">{activity.description}</div>
                            </li>
                        )) : (
                          <p className="text-sm text-muted-foreground">No recent activities found.</p>
                        )}
                    </ul>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
            {/* System Status */}
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                        Systemstatus
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        <li className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <Wrench className="h-5 w-5 text-muted-foreground" />
                                <span>Alle Kernsysteme</span>
                            </div>
                            <span className="font-semibold text-green-600">Betriebsbereit</span>
                        </li>
                        <li className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <Server className="h-5 w-5 text-muted-foreground" />
                                <span>KI-Dienste</span>
                            </div>
                            <span className="font-semibold text-green-600">Verbunden</span>
                        </li>
                         <li className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <Database className="h-5 w-5 text-muted-foreground" />
                                <span>Datenbank</span>
                            </div>
                            <span className="font-semibold text-green-600">Verbunden</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
