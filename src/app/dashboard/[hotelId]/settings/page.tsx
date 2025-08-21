import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getHotelById } from '@/lib/actions/hotel.actions';
import { Settings } from 'lucide-react';

export default async function HotelSettingsPage({ params }: { params: { hotelId: string } }) {
  const hotel = await getHotelById(params.hotelId);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
       <div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Hotel Settings</h1>
        <p className="text-muted-foreground">Manage your hotel's profile and configuration.</p>
      </div>
      <Card>
        <CardHeader>
            <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary p-3 text-primary-foreground">
                    <Settings className="h-6 w-6" />
                </div>
                <div>
                    <CardTitle className="font-headline text-2xl">Hotel Information</CardTitle>
                    <CardDescription>Update your hotel's public details here.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="hotel-name">Hotel Name</Label>
                    <Input id="hotel-name" defaultValue={hotel.name} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="hotel-address">Address</Label>
                    <Input id="hotel-address" defaultValue={hotel.address} />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="hotel-city">City</Label>
                    <Input id="hotel-city" defaultValue={hotel.city} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="hotel-country">Country</Label>
                    <Input id="hotel-country" defaultValue={hotel.country} />
                </div>
            </div>
            <div className="flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
