"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/cars", label: "Cars for Sale" },
  { href: "/auctions", label: "Auctions" },
  { href: "/hotels", label: "Car Hotels" },
  { href: "/advertise", label: "Advertise" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener("scroll", handleScroll);
    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  return (
    <header className={cn(
      "fixed top-0 z-50 w-full text-white transition-all duration-300",
       "bg-transparent"
    )}>
      <div className={cn("container mx-auto flex items-center justify-between transition-all duration-300 h-24 border-b border-white/10")}>
        <Link href="/" className="flex items-center gap-2">
            <Image src="https://placehold.co/150x50.png" alt="BestCarEvents Logo" width={150} height={50} data-ai-hint="logo" />
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" className="hover:text-primary">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          <Button variant="ghost" className="hover:text-primary px-4 font-semibold">
            Login
          </Button>
          <Button className="rounded-md font-bold bg-primary text-primary-foreground hover:bg-primary/90">
            Register
          </Button>
        </div>
      </div>
    </header>
  );
}
