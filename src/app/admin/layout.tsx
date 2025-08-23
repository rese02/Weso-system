import Link from "next/link";
import {
  Home,
  ShieldCheck,
  Hotel,
  PlusCircle
} from "lucide-react";
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar>
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center px-6 border-b">
              <Link href="/admin" className="flex items-center gap-2 font-headline text-xl font-semibold">
                <Hotel className="h-7 w-7 text-primary" />
                <span>HotelHub</span>
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarMenu className="p-4">
                <SidebarMenuItem>
                  <SidebarMenuButton href="/admin" tooltip="Dashboard">
                    <Home />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton href="/admin/create-hotel" tooltip="Create Hotel">
                    <PlusCircle />
                    <span>Create Hotel</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton href="/admin/security-advisor" tooltip="Security Advisor">
                    <ShieldCheck />
                    <span>Security Advisor</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </div>
        </Sidebar>
        <div className="flex flex-1 flex-col">
            <DashboardHeader 
              title="Agency Dashboard"
              user={{ name: "Weso Systems", email: "admin@weso.com" }}
            />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
