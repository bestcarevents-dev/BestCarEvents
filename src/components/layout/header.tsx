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
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/cars", label: "Cars for Sale" },
  { href: "/auctions", label: "Auctions" },
  { href: "/hotels", label: "Car Hotels" },
  { href: "/advertise", label: "Advertise" },
];

const AuthButtons = () => (
  <div className="flex flex-col lg:flex-row items-center gap-4">
    <Button variant="ghost" className="w-full lg:w-auto justify-start lg:justify-center">
      Login
    </Button>
    <Button className="w-full lg:w-auto">Sign Up</Button>
  </div>
);

const NavMenu = () => (
    <nav className="flex flex-col lg:flex-row items-start lg:items-center gap-6 mt-6 lg:mt-0 lg:gap-8 text-lg lg:text-sm font-medium">
        {navLinks.map((link) => (
        <Link
            key={link.href}
            href={link.href}
            className="transition-colors hover:text-primary w-full"
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
                { mobileMenuOpen ? <X /> : <AlignJustify /> }
                <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-background text-foreground p-8">
            <SheetHeader>
                <SheetTitle className="text-2xl font-bold text-left font-headline tracking-tighter">BestCarEvents</SheetTitle>
            </SheetHeader>
            <div className="mt-8 flex flex-col h-full">
                <NavMenu />
                <div className="mt-auto border-t pt-6">
                    <AuthButtons />
                </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
