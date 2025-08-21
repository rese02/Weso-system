import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Hotel, BedDouble, ChevronRight } from 'lucide-react';
import { getHotels } from '@/lib/actions/hotel.actions';

export default async function AdminDashboardPage() {
  const hotels = await getHotels();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Managed Hotels</h1>
          <p className="text-muted-foreground">Oversee and manage all hotel properties from here.</p>
        </div>
        <Button asChild>
          <Link href="/admin/create-hotel">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Hotel
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel) => (
          <Card key={hotel.id} className="transform transition-transform hover:scale-105 hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium font-headline">{hotel.name}</CardTitle>
              <Hotel className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <CardDescription>{hotel.city}, {hotel.country}</CardDescription>
              <div className="text-2xl font-bold pt-2 flex items-center gap-2">
                <BedDouble className="h-6 w-6 text-muted-foreground" />
                <span>{hotel.bookings} Bookings</span>
              </div>
              <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                <Link href={`/dashboard/${hotel.id}`}>
                  Manage Hotel
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
