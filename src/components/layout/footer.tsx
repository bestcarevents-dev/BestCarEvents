import Link from "next/link";
import { Car, Facebook, Twitter, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          <div className="md:col-span-4">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Car className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold font-headline tracking-tighter text-foreground">BestCarEvents</span>
            </Link>
            <p className="text-sm max-w-xs">The premier destination for automotive enthusiasts to discover events, buy and sell unique cars, and connect with a vibrant community.</p>
             <div className="flex mt-6 space-x-4">
                <Link href="#" className="hover:text-primary transition-colors"><Facebook size={20}/></Link>
                <Link href="#" className="hover:text-primary transition-colors"><Twitter size={20}/></Link>
                <Link href="#" className="hover:text-primary transition-colors"><Instagram size={20}/></Link>
              </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold font-headline text-foreground">Marketplace</h3>
              <ul className="mt-4 space-y-3">
                <li><Link href="/cars" className="text-sm hover:text-primary transition-colors">Cars for Sale</Link></li>
                 <li><Link href="/auctions" className="text-sm hover:text-primary transition-colors">Auctions</Link></li>
              </ul>
            </div>
             <div>
              <h3 className="font-semibold font-headline text-foreground">Events</h3>
              <ul className="mt-4 space-y-3">
                <li><Link href="/events" className="text-sm hover:text-primary transition-colors">All Events</Link></li>
                <li><Link href="#" className="text-sm hover:text-primary transition-colors">Submit an Event</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold font-headline text-foreground">Community</h3>
              <ul className="mt-4 space-y-3">
                <li><Link href="/hotels" className="text-sm hover:text-primary transition-colors">Car Storage</Link></li>
                <li><Link href="#" className="text-sm hover:text-primary transition-colors">Forums</Link></li>
                <li><Link href="/advertise" className="text-sm hover:text-primary transition-colors">Advertise</Link></li>
              </ul>
            </div>
             <div>
              <h3 className="font-semibold font-headline text-foreground">Company</h3>
              <ul className="mt-4 space-y-3">
                 <li><Link href="/about" className="text-sm hover:text-primary transition-colors">About Us</Link></li>
                 <li><Link href="/contact" className="text-sm hover:text-primary transition-colors">Contact</Link></li>
                 <li><Link href="/terms" className="text-sm hover:text-primary transition-colors">Terms of Service</Link></li>
                 <li><Link href="/privacy" className="text-sm hover:text-primary transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} BestCarEvents. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
