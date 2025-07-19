import Link from "next/link";
import { Car } from "lucide-react";

const footerLinks = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
];

const socialLinks = [
  { name: "Facebook", icon: "f" },
  { name: "Twitter", icon: "t" },
  { name: "Instagram", icon: "i" },
];

export default function Footer() {
  return (
    <footer className="bg-card text-card-foreground border-t">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Car className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold font-headline">BestCarEvents</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">The best place to find car events and your next ride.</p>
          </div>
          <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold font-headline text-foreground">Quick Links</h3>
              <ul className="mt-4 space-y-2">
                {footerLinks.slice(0, 2).map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
             <div>
              <h3 className="font-semibold font-headline text-foreground">Legal</h3>
              <ul className="mt-4 space-y-2">
                 {footerLinks.slice(2, 4).map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
             <div>
              <h3 className="font-semibold font-headline text-foreground">Explore</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/events" className="text-sm text-muted-foreground hover:text-primary">Events</Link></li>
                <li><Link href="/cars" className="text-sm text-muted-foreground hover:text-primary">Cars for Sale</Link></li>
              </ul>
            </div>
             <div>
              <h3 className="font-semibold font-headline text-foreground">Follow Us</h3>
                {/* Placeholder for social icons */}
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} BestCarEvents. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
