'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import {
  LayoutDashboard,
  BedDouble,
  Settings,
  PlusCircle,
  Loader2,
} from "lucide-react";
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { getHotelById } from "@/lib/actions/hotel.actions";
import type { Hotel } from '@/lib/definitions';

export default function HotelierLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { hotelId: string };
}) {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHotel() {
      if (!params.hotelId) return;
      setIsLoading(true);
      const hotelData = await getHotelById(params.hotelId);
      setHotel(hotelData);
      setIsLoading(false);
    }
    fetchHotel();
  }, [params.hotelId]);

  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-secondary/50">
        <Sidebar>
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center border-b px-4">
              <Link href={`/dashboard/${params.hotelId}`} className="flex items-center gap-2 font-headline text-lg font-semibold text-primary">
                <span>{hotel?.name ?? "Hotel"}</span>
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarMenu className="p-4">
                <SidebarMenuItem>
                  <SidebarMenuButton href={`/dashboard/${params.hotelId}`} tooltip="Dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton href={`/dashboard/${params.hotelId}/bookings/create-booking`} tooltip="Neue Buchung">
                    <PlusCircle />
                    <span>Neue Buchung</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton href={`/dashboard/${params.hotelId}/bookings`} tooltip="Buchungen">
                    <BedDouble />
                    <span>Buchungen</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton href={`/dashboard/${params.hotelId}/settings`} tooltip="Einstellungen">
                    <Settings />
                    <span>Einstellungen</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </div>
        </Sidebar>
        <div className="flex flex-1 flex-col">
            <DashboardHeader 
              title="Hotel Dashboard"
              user={{ name: hotel?.name ?? "Hotel User", email: hotel?.contactEmail ?? 'N/A' }}
              userRole="hotelier"
            />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
