'use client';

import { LogOut, User, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

type DashboardHeaderProps = {
  title: string;
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  userRole: 'agency' | 'hotelier';
};

export function DashboardHeader({ title, user, userRole }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    // In a real app, you would also clear any session cookies or tokens
    // and call Firebase's signOut() method.
    if (userRole === 'agency') {
      router.push('/agency/login');
    } else {
      router.push('/hotel/login');
    }
  };


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 w-full">
      <h1 className="font-headline text-2xl font-semibold text-primary">{title}</h1>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <div className="hidden text-right md:block">
              <p className="font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Avatar>
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
