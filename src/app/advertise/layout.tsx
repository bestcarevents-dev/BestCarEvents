"use client";

import Link from "next/link";
import { Home, PlusCircle, Menu, CreditCard, List, Car, ChevronDown, ChevronRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/advertise/dashboard", icon: Home, label: "Buy Advertistments" },
  { href: "/advertise/cars", icon: Car, label: "Buy Car Listings" },
  { href: "/advertise/my-ads", icon: List, label: "My Ads" },
  { href: "/advertise/advertise", icon: PlusCircle, label: "Advertise New Product" },
  { href: "/advertise/newsletter-mentions", icon: Mail, label: "Newsletter Mentions" },
 
];


// { href: "/advertise/billing", icon: CreditCard, label: "Billing Management" },
const featureListingLinks = [
  { href: "/advertise/listings", label: "All Listings" },
  { href: "/advertise/cars-listing", label: "Cars Listing" },
  { href: "/advertise/events-listing", label: "Events Listing" },
  { href: "/advertise/auction-listing", label: "Auction Listing" },
  { href: "/advertise/hotel-listing", label: "Hotel Listing" },
  { href: "/advertise/club-listing", label: "Club Listing" },
];

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isFeatureListingsOpen, setIsFeatureListingsOpen] = useState(false);

  // Check if current path is in feature listings
  const isInFeatureListings = pathname.startsWith('/advertise/listings') || 
                             pathname.startsWith('/advertise/cars-listing') ||
                             pathname.startsWith('/advertise/events-listing') ||
                             pathname.startsWith('/advertise/auction-listing') ||
                             pathname.startsWith('/advertise/hotel-listing') ||
                             pathname.startsWith('/advertise/club-listing');

  // Auto-open feature listings if we're in one of those pages
  useEffect(() => {
    if (isInFeatureListings) {
      setIsFeatureListingsOpen(true);
    }
  }, [isInFeatureListings]);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="font-bold text-lg">BestCarEvents</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {
                    "bg-muted text-primary": pathname.startsWith(link.href)
                  })}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
              
              {/* Feature Listings Section */}
              <div className="mt-2">
                <button
                  onClick={() => setIsFeatureListingsOpen(!isFeatureListingsOpen)}
                  className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {
                    "bg-muted text-primary": isInFeatureListings
                  })}
                >
                  <div className="flex items-center gap-3">
                    <List className="h-4 w-4" />
                    <span>Feature Listings</span>
                  </div>
                  {isFeatureListingsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                
                {isFeatureListingsOpen && (
                  <div className="ml-6 mt-1 space-y-1">
                    {featureListingLinks.map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:text-primary", {
                          "bg-muted text-primary": pathname === link.href
                        })}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <span className="font-bold text-lg">BestCarEvents</span>
                </Link>
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
                
                {/* Mobile Feature Listings */}
                <div className="mt-4">
                  <div className="flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground">
                    <List className="h-5 w-5" />
                    <span>Feature Listings</span>
                  </div>
                  <div className="ml-6 mt-2 space-y-2">
                    {featureListingLinks.map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block text-sm text-muted-foreground hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1" />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 