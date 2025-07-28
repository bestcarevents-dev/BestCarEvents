"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlignJustify, Search, X, ChevronDown, User as UserIcon, Car, LogOut, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getAuth, onAuthStateChanged, signOut, type User } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/cars", label: "Cars for Sale" },
  { href: "/auctions", label: "Auctions" },
  { href: "/hotels", label: "Car Hotels" },
  { href: "/clubs", label: "Car Clubs" },
  { href: "/partners", label: "Partners" },
  { href: "/advertise-with-us", label: "Pricing" },
];

const FLAG_UK = "https://flagcdn.com/gb.svg";
const FLAG_IT = "https://flagcdn.com/it.svg";

const AuthButtons = ({ inMobileNav = false, user }: { inMobileNav?: boolean, user: User | null }) => {
  const router = useRouter();
  const auth = getAuth(app);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (user) {
    if (inMobileNav) {
      // Keep logout in mobile nav for accessibility
      return (
        <div className={cn("flex items-center", inMobileNav ? "flex-col w-full gap-4" : "flex-row gap-2")}> 
          <span className="text-sm mr-4">Hi, {user.email}</span>
          <Button onClick={handleLogout} variant={inMobileNav ? "outline" : "ghost"} className="w-full lg:w-auto justify-center">
            Logout
          </Button>
        </div>
      );
    }
    // Desktop: show dropdown
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200">
            <UserIcon className="w-4 h-4" />
            {user.email}
            <ChevronDown className="w-4 h-4 ml-1 transition-transform duration-200" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 mt-2 bg-white/95 backdrop-blur-sm border border-white/20 shadow-xl">
          <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200">
            <Link href="/advertise/dashboard" className="flex items-center gap-3 w-full">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-200" />
          <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200">
            <Link href="/advertise/listings" className="flex items-center gap-3 w-full">
              <Car className="w-4 h-4" />
              My Listings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-200" />
          <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200">
            <Link href="/advertise/cars" className="flex items-center gap-3 w-full">
              <Car className="w-4 h-4" />
              Sell your car
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-200" />
          <DropdownMenuItem 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn("flex items-center", inMobileNav ? "flex-col w-full gap-4" : "flex-row gap-2")}> 
      <Button asChild variant={inMobileNav ? "outline" : "ghost"} className="w-full lg:w-auto justify-center">
        <Link href="/login">Login</Link>
      </Button>
      <Button asChild className="w-full lg:w-auto">
        <Link href="/register">Sign Up</Link>
      </Button>
    </div>
  );
};

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
  const [user, setUser] = useState<User | null>(null);
  const auth = getAuth(app);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => {
        window.removeEventListener("scroll", handleScroll);
        unsubscribe();
    }
  }, [auth]);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full text-white transition-all duration-300",
        scrolled ? "bg-black/80 backdrop-blur-sm" : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold font-headline tracking-tighter">
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-white/30 to-orange-50/50 rounded-full p-1 shadow-lg"></div>
                <div className="relative z-10 p-2">
                    <Image src="/logo.png" alt="BestCarEvents Logo" width={70} height={70} />
                </div>
            </div>
            BestCarEvents
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          <NavMenu />
        </div>

        <div className="hidden lg:flex items-center gap-2">
            {/* Language Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/20 focus:outline-none">
                  <Image src={FLAG_UK} alt="English (UK)" width={24} height={16} className="rounded shadow" />
                  <ChevronDown className="w-4 h-4 ml-1 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="flex items-center gap-2">
                  <Image src={FLAG_IT} alt="Italiano" width={24} height={16} className="rounded shadow" />
                  Italiano
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* End Language Dropdown */}
            <AuthButtons user={user} />
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
                    <div className="flex items-center gap-2">
                         <div className="relative">
                             <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-white/30 to-orange-50/50 rounded-full p-1 shadow-lg"></div>
                             <div className="relative z-10 p-2">
                                 <Image src="/logo.png" alt="BestCarEvents Logo" width={80} height={80} />
                             </div>
                         </div>
                        <SheetTitle className="text-2xl font-bold text-left font-headline tracking-tighter">BestCarEvents</SheetTitle>
                    </div>
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
                    <AuthButtons inMobileNav user={user} />
                </div>
              </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}