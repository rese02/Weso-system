import Link from "next/link";
import { Hotel } from 'lucide-react';

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 p-4 border-b">
         <Link href="/" className="flex items-center gap-2 font-headline text-xl font-semibold text-primary">
            <Hotel className="h-7 w-7" />
            <span>HotelHub Central</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center py-8">
        {children}
      </main>
      <footer className="p-4 text-center text-sm text-muted-foreground border-t bg-background">
        <div className="space-x-4">
            <Link href="/guest/privacy" className="hover:text-primary">Privacy Policy</Link>
            <span>&bull;</span>
            <Link href="/guest/terms" className="hover:text-primary">Terms & Conditions</Link>
        </div>
        <p className="mt-2">&copy; {new Date().getFullYear()} HotelHub Central. All rights reserved.</p>
      </footer>
    </div>
  );
}
