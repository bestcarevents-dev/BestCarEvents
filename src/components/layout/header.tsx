"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Car, Menu, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/cars", label: "Cars for Sale" },
  { href: "/auctions", label: "Auctions" },
  { href: "/hotels", label: "Car Hotels" },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 z-50 w-full text-white transition-all duration-300",
      hasScrolled ? "bg-background/80 backdrop-blur-lg shadow-md" : "bg-transparent"
    )}>
      <div className={cn("container flex items-center justify-between transition-all duration-300", hasScrolled ? "h-20" : "h-24")}>
        <Link href="/" className="flex items-center gap-2">
          <Car className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold font-headline tracking-tighter">BestCarEvents</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" asChild className="hover:text-primary">
            <Link href="/dashboard"><User className="h-5 w-5" /><span className="sr-only">Dashboard</span></Link>
          </Button>
          <Button className="hidden sm:inline-flex rounded-full font-bold" variant="outline">
            <Plus className="mr-2 h-4 w-4"/>
            List Your Car
          </Button>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-background text-foreground">
               <div className="p-4 mt-8 flex flex-col h-full">
                <nav className="flex flex-col gap-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-medium transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                   <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-medium transition-colors hover:text-primary"
                    >
                      Dashboard
                    </Link>
                </nav>
                 <Button className="w-full mt-auto" size="lg">
                    <Plus className="mr-2 h-4 w-4"/>
                    List Your Car
                 </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
