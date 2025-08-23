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
    Wrench 
} from 'lucide-react';

export default async function HotelDashboardPage({ params }: { params: { hotelId: string } }) {
  const data = await getHotelDashboardData(params.hotelId);

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
      
      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3 space-y-6">
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
                        {data.recentActivities.map(activity => (
                            <li key={activity.id} className="flex items-center gap-3">
                                <div className="text-muted-foreground font-mono text-xs">{activity.timestamp}</div>
                                <div className="flex-1">{activity.description}</div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
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
