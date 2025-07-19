"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlignJustify, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/cars", label: "Cars for Sale" },
  { href: "/auctions", label: "Auctions" },
  { href: "/hotels", label: "Car Hotels" },
  { href: "/advertise", label: "Advertise" },
];

const AuthButtons = ({ inMobileNav = false }: { inMobileNav?: boolean}) => (
  <div className={cn(
    "flex items-center", 
    inMobileNav ? "flex-col w-full gap-4" : "flex-row gap-2"
  )}>
    <Button variant={inMobileNav ? "outline" : "ghost"} className="w-full lg:w-auto justify-center">
      Login
    </Button>
    <Button className="w-full lg:w-auto">Sign Up</Button>
  </div>
);

const NavMenu = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <nav className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8 text-lg lg:text-sm font-medium">
        {navLinks.map((link) => (
        <Link
            key={link.href}
            href={link.href}
            className="transition-colors hover:text-primary w-full lg:w-auto text-center lg:text-left"
            onClick={onLinkClick}
        >
            {link.label}
        </Link>
        ))}
  </nav>
);


export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full text-white transition-all duration-300",
        scrolled ? "bg-black/80 backdrop-blur-sm" : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold font-headline tracking-tighter">
            BestCarEvents
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          <NavMenu />
        </div>

        <div className="hidden lg:flex items-center gap-2">
            <Button variant="ghost" size="icon">
                <Search />
                <span className="sr-only">Search</span>
            </Button>
            <AuthButtons />
        </div>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
                <AlignJustify />
                <span className="sr-only">Open Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full bg-background text-foreground p-0">
              <div className="flex flex-col h-full">
                <SheetHeader className="flex flex-row items-center justify-between p-4 border-b">
                  <SheetTitle className="text-2xl font-bold text-left font-headline tracking-tighter">BestCarEvents</SheetTitle>
                   <SheetClose asChild>
                    <Button variant="ghost" size="icon">
                      <X />
                      <span className="sr-only">Close menu</span>
                    </Button>
                   </SheetClose>
                </SheetHeader>
                <div className="p-6 flex-grow flex flex-col gap-8">
                  <NavMenu onLinkClick={() => setMobileMenuOpen(false)} />
                </div>
                <div className="p-6 border-t">
                    <AuthButtons inMobileNav />
                </div>
              </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
