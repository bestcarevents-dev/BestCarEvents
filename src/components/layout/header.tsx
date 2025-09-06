"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlignJustify, Search, X, ChevronDown, User as UserIcon, Car, LogOut, LayoutDashboard, Calendar, Users, Gavel, Settings } from "lucide-react";
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
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/forum", label: "Forum" },
  { href: "/auctions", label: "Auctions" },
  { href: "/others", label: "Others" },
  { href: "/partners", label: "Partners" },
  { href: "/advertise-with-us", label: "Pricing" },
];

const automotiveLinks = [
  { href: "/cars", label: "Cars for Sale" },
  { href: "/hotels", label: "Car Hotels" },
  { href: "/clubs", label: "Car Clubs" },
];

const FLAG_UK = "https://flagcdn.com/gb.svg";
const FLAG_IT = "https://flagcdn.com/it.svg";

// Helper function to check if a link is active
const isActiveLink = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
};

const AuthButtons = ({ inMobileNav = false, user, onMobileMenuClose }: { inMobileNav?: boolean, user: User | null, onMobileMenuClose?: () => void }) => {
  const router = useRouter();
  const auth = getAuth(app);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (user) {
    if (inMobileNav) {
      // Mobile navigation with all options
      return (
        <div className={cn("flex items-center", inMobileNav ? "flex-col w-full gap-6" : "flex-row gap-2")}> 
          <div className="w-full text-center">
            <span className="text-lg font-semibold text-white">Hi, {user.email}</span>
          </div>
          
          {/* Mobile My Listings Section */}
          <div className="w-full">
            <div className="text-lg font-bold text-white mb-4 pb-2 border-b-2 border-orange-500">My Listings</div>
            <div className="space-y-3 pl-2">
              <Link 
                href="/advertise/cars-listing" 
                className="flex items-center gap-4 px-4 py-3 text-base text-gray-900 hover:text-white hover:bg-yellow-600 rounded-lg transition-all duration-200 border border-gray-300 bg-white shadow-sm"
                onClick={onMobileMenuClose}
              >
                <Car className="w-5 h-5 text-yellow-600" />
                <span className="font-medium">Cars Listing</span>
              </Link>
              <Link 
                href="/advertise/events-listing" 
                className="flex items-center gap-4 px-4 py-3 text-base text-gray-900 hover:text-white hover:bg-yellow-600 rounded-lg transition-all duration-200 border border-gray-300 bg-white shadow-sm"
                onClick={onMobileMenuClose}
              >
                <Calendar className="w-5 h-5 text-yellow-600" />
                <span className="font-medium">Events Listing</span>
              </Link>
              <Link 
                href="/advertise/auction-listing" 
                className="flex items-center gap-4 px-4 py-3 text-base text-gray-900 hover:text-white hover:bg-yellow-600 rounded-lg transition-all duration-200 border border-gray-300 bg-white shadow-sm"
                onClick={onMobileMenuClose}
              >
                <Gavel className="w-5 h-5 text-yellow-600" />
                <span className="font-medium">Auction Listing</span>
              </Link>
              <Link 
                href="/advertise/club-listing" 
                className="flex items-center gap-4 px-4 py-3 text-base text-gray-900 hover:text-white hover:bg-yellow-600 rounded-lg transition-all duration-200 border border-gray-300 bg-white shadow-sm"
                onClick={onMobileMenuClose}
              >
                <Users className="w-5 h-5 text-yellow-600" />
                <span className="font-medium">Club Listing</span>
              </Link>
              <Link 
                href="/advertise/hotel-listing" 
                className="flex items-center gap-4 px-4 py-3 text-base text-gray-900 hover:text-white hover:bg-yellow-600 rounded-lg transition-all duration-200 border border-gray-300 bg-white shadow-sm"
                onClick={onMobileMenuClose}
              >
                <Car className="w-5 h-5 text-yellow-600" />
                <span className="font-medium">Hotel Listing</span>
              </Link>
              <Link 
                href="/advertise/others-listing" 
                className="flex items-center gap-4 px-4 py-3 text-base text-gray-900 hover:text-white hover:bg-yellow-600 rounded-lg transition-all duration-200 border border-gray-300 bg-white shadow-sm"
                onClick={onMobileMenuClose}
              >
                <Settings className="w-5 h-5 text-yellow-600" />
                <span className="font-medium">Others Listing</span>
              </Link>
            </div>
          </div>
          
          <div className="w-full space-y-3">
            <Link 
              href="/advertise/my-ads" 
              className="flex items-center gap-4 w-full px-4 py-3 text-base text-gray-900 hover:text-white hover:bg-yellow-600 rounded-lg transition-all duration-200 border border-gray-300 bg-white shadow-sm font-medium"
              onClick={onMobileMenuClose}
            >
              <Car className="w-5 h-5 text-yellow-600" />
              My Ads
            </Link>

            <Link 
              href="/advertise/advertise" 
              className="flex items-center gap-4 w-full px-4 py-3 text-base text-gray-900 hover:text-white hover:bg-yellow-600 rounded-lg transition-all duration-200 border border-gray-300 bg-white shadow-sm font-medium"
              onClick={onMobileMenuClose}
            >
              <Car className="w-5 h-5 text-yellow-600" />
              Advertise
            </Link>

            <Link 
              href="/advertise/newsletter-mentions" 
              className="flex items-center gap-4 w-full px-4 py-3 text-base text-gray-900 hover:text-white hover:bg-yellow-600 rounded-lg transition-all duration-200 border border-gray-300 bg-white shadow-sm font-medium"
              onClick={onMobileMenuClose}
            >
              <Car className="w-5 h-5 text-yellow-600" />
              Newsletter Mentions
            </Link>
            
            <Link 
              href="/advertise/dashboard" 
              className="flex items-center gap-4 w-full px-4 py-3 text-base text-gray-900 hover:text-white hover:bg-yellow-600 rounded-lg transition-all duration-200 border border-gray-300 bg-white shadow-sm font-medium"
              onClick={onMobileMenuClose}
            >
              <LayoutDashboard className="w-5 h-5 text-yellow-600" />
              Dashboard
            </Link>
          </div>
          
          <div className="w-full pt-4 border-t-2 border-gray-300">
            <Button 
              onClick={handleLogout}
              variant="outline" 
              className="w-full justify-center py-3 text-base font-medium border-red-500 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 bg-white"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      );
    }

    // Desktop: show dropdown with nested submenu
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
          <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors duration-200">
            <Link href="/account" className="flex items-center gap-3 w-full">
              <UserIcon className="w-4 h-4" />
              My Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          
          
          {/* My Listings Submenu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors duration-200 cursor-pointer">
                <Car className="w-4 h-4" />
                My Listings
                  <ChevronDown className="w-4 h-4 ml-auto" />
              </DropdownMenuItem>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white/95 backdrop-blur-sm border border-white/20 shadow-xl min-w-[200px] ml-2">
              <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors duration-200">
                <Link href="/advertise/cars-listing" className="flex items-center gap-3 w-full">
                  <Car className="w-4 h-4" />
                  Cars Listing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors duration-200">
                <Link href="/advertise/events-listing" className="flex items-center gap-3 w-full">
                  <Calendar className="w-4 h-4" />
                  Events Listing
                </Link>
              </DropdownMenuItem>

              
              <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors duration-200">
                <Link href="/advertise/auction-listing" className="flex items-center gap-3 w-full">
                  <Gavel className="w-4 h-4" />
                  Auction Listing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors duration-200">
                <Link href="/advertise/club-listing" className="flex items-center gap-3 w-full">
                  <Users className="w-4 h-4" />
                  Club Listing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors duration-200">
                <Link href="/advertise/hotel-listing" className="flex items-center gap-3 w-full">
                  <Car className="w-4 h-4" />
                  Hotel Listing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors duration-200">
                <Link href="/advertise/others-listing" className="flex items-center gap-3 w-full">
                  <Settings className="w-4 h-4" />
                  Others Listing
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenuSeparator className="bg-gray-200" />
          <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors duration-200">
            <Link href="/advertise/advertise" className="flex items-center gap-3 w-full">
              <Car className="w-4 h-4" />
              Advertise
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-gray-200" />
          <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors duration-200">
            <Link href="/advertise/my-ads" className="flex items-center gap-3 w-full">
              <Car className="w-4 h-4" />
              My Ads
            </Link>
          </DropdownMenuItem>
         

 
          <DropdownMenuSeparator className="bg-gray-200" />
          <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors duration-200">
            <Link href="/advertise/newsletter-mentions" className="flex items-center gap-3 w-full">
              <LayoutDashboard className="w-4 h-4" />
              Newsletter Mentions
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-gray-200" />
          <DropdownMenuItem asChild className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors duration-200">
            <Link href="/advertise/dashboard" className="flex items-center gap-3 w-full">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
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

  // Not logged in
  return (
    <div className={cn("flex items-center", inMobileNav ? "flex-col w-full gap-4" : "flex-row gap-2")}> 
      <Button asChild variant={inMobileNav ? "outline" : "ghost"} className="w-full lg:w-auto justify-center">
        <Link href="/login" onClick={onMobileMenuClose}>Login</Link>
      </Button>
      <Button asChild className="w-full lg:w-auto">
        <Link href="/register" onClick={onMobileMenuClose}>Sign Up</Link>
      </Button>
    </div>
  );
};

const NavMenu = ({ onLinkClick, isMobile = false }: { onLinkClick?: () => void, isMobile?: boolean }) => {
  const pathname = usePathname();

  // Check if any automotive link is active
  const isAutomotiveActive = automotiveLinks.some(link => isActiveLink(pathname, link.href));

  if (isMobile) {
    return (
      <nav className="flex flex-col gap-4">
        {navLinks.map((link) => (
          <div key={link.href} className="relative">
            <Link
              href={link.href}
              className={cn(
                "text-white hover:text-yellow-300 transition-all duration-300 font-medium text-lg py-3 px-4 rounded-lg block",
                isActiveLink(pathname, link.href) 
                  ? "text-yellow-300 bg-yellow-300/10 border-l-4 border-yellow-300" 
                  : "hover:bg-white/5"
              )}
              onClick={onLinkClick}
            >
              {link.label}
            </Link>
          </div>
        ))}
        
        <div className="space-y-2">
          <div className={cn(
            "text-white font-medium text-lg py-2 px-4",
            isAutomotiveActive && "text-yellow-300"
          )}>
            Automotive
          </div>
          <div className="pl-4 space-y-2">
            {automotiveLinks.map((link) => (
              <div key={link.href} className="relative">
                <Link
                  href={link.href}
                  className={cn(
                    "block text-white hover:text-yellow-300 transition-all duration-300 font-medium py-2 px-4 rounded-lg",
                    isActiveLink(pathname, link.href) 
                      ? "text-yellow-300 bg-yellow-300/10 border-l-4 border-yellow-300" 
                      : "hover:bg-white/5"
                  )}
                  onClick={onLinkClick}
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-4">
      {navLinks.map((link) => {
        const active = isActiveLink(pathname, link.href);
        return (
          <div key={link.href} className="relative group px-1 py-2">
            <Link
              href={link.href}
              className={cn(
                "font-medium transition-colors duration-200",
                active ? "text-yellow-300" : "text-white hover:text-yellow-300"
              )}
              onClick={onLinkClick}
            >
              {link.label}
            </Link>
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-yellow-300 transition-all duration-200",
                active ? "w-6 opacity-100" : "w-0 opacity-0 group-hover:w-6 group-hover:opacity-80"
              )}
            />
          </div>
        );
      })}
      
      <div className="relative group px-1 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1 font-medium transition-colors duration-200",
                isAutomotiveActive ? "text-yellow-300" : "text-white hover:text-yellow-300"
              )}
            >
              Automotive
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {automotiveLinks.map((link) => (
              <DropdownMenuItem key={link.href} asChild>
                <Link href={link.href} onClick={onLinkClick}>
                  {link.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-yellow-300 transition-all duration-200",
            isAutomotiveActive ? "w-6 opacity-100" : "w-0 opacity-0 group-hover:w-6 group-hover:opacity-80"
          )}
        />
      </div>
    </nav>
  );
};

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { language, setLanguage } = useLanguage();
  const auth = getAuth(app);
  const pathname = usePathname();
  const router = useRouter();

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
        pathname === "/" && !scrolled
          ? "bg-transparent backdrop-blur-0 border-b-0 shadow-none"
          : (scrolled
              ? "bg-amber-950/40 backdrop-blur-md border-b border-yellow-200/30 shadow-lg"
              : "bg-slate-800/40 backdrop-blur-md border-b border-blue-200/30 shadow-lg")
      )}
    >
      <div className="container mx-auto flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold font-headline tracking-tighter">
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-white/30 to-orange-50/50 rounded-full p-1 shadow-lg hidden lg:block"></div>
                <div className="relative z-10 p-2">
                    <Image src="/logo.png" alt="BestCarEvents Logo" width={70} height={70} />
                </div>
            </div>
            BestCarEvents
        </Link>

        <div className="hidden lg:flex items-center gap-4">
          <NavMenu />
        </div>

        <div className="hidden lg:flex items-center gap-2">
            {/* Language Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/20 focus:outline-none">
                  <Image 
                    src={language === 'it' ? FLAG_IT : FLAG_UK} 
                    alt={language === 'it' ? "Italiano" : "English (UK)"} 
                    width={24} 
                    height={16} 
                    className="rounded shadow" 
                  />
                  <ChevronDown className="w-4 h-4 ml-1 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  className="flex items-center gap-2"
                  onClick={() => {
                    setLanguage('en');
                    document.cookie = `NEXT_LOCALE=en; path=/; max-age=31536000`;
                    const parts = pathname.split('/').filter(Boolean);
                    // If first segment is a known locale, drop it; else stay
                    const locales = new Set(['en','sv','da','ur','it']);
                    const first = parts[0];
                    const rest = locales.has(first || '') ? parts.slice(1) : parts;
                    const href = '/' + rest.join('/');
                    router.push(href || '/');
                  }}
                >
                  <Image src={FLAG_UK} alt="English (UK)" width={24} height={16} className="rounded shadow" />
                  English
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center gap-2"
                  onClick={() => {
                    setLanguage('it');
                    document.cookie = `NEXT_LOCALE=it; path=/; max-age=31536000`;
                    const parts = pathname.split('/').filter(Boolean);
                    const locales = new Set(['en','sv','da','ur','it']);
                    const first = parts[0];
                    const rest = locales.has(first || '') ? parts.slice(1) : parts;
                    const href = '/it/' + rest.join('/');
                    router.push(href.replace(/\/$/, ''));
                  }}
                >
                  <Image src={FLAG_IT} alt="Italiano" width={24} height={16} className="rounded shadow" />
                  Italiano
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* End Language Dropdown */}
            <AuthButtons user={user} onMobileMenuClose={() => setMobileMenuOpen(false)} />
        </div>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
                <AlignJustify />
                <span className="sr-only">Open Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full bg-background text-foreground p-0 overflow-y-auto">
              <div className="flex flex-col h-full">
                <SheetHeader className="flex flex-row items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                         <Image src="/logo.png" alt="BestCarEvents Logo" width={50} height={50} />
                        <SheetTitle className="text-lg font-bold text-left font-headline tracking-tighter">BestCarEvents</SheetTitle>
                    </div>
                   <SheetClose asChild>
                    <Button variant="ghost" size="icon">
                      <X />
                      <span className="sr-only">Close menu</span>
                    </Button>
                   </SheetClose>
                </SheetHeader>
                <div className="p-6 flex-grow flex flex-col gap-8">
                  <NavMenu onLinkClick={() => setMobileMenuOpen(false)} isMobile={true} />
                  
                  {/* Mobile Language Dropdown */}
                  <div className="space-y-4">
                    <div className="text-lg font-bold text-white pb-2 border-b-2 border-yellow-500">Language</div>
                    <div className="space-y-3 pl-2">
                      <button 
                        onClick={() => {
                          setLanguage('en');
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-4 w-full px-4 py-3 text-base rounded-lg transition-all duration-200 border ${
                          language === 'en' 
                            ? 'text-white bg-yellow-600 border-yellow-600' 
                            : 'text-gray-900 hover:text-white hover:bg-yellow-600 border-gray-300 bg-white shadow-sm'
                        }`}
                      >
                        <Image src={FLAG_UK} alt="English (UK)" width={24} height={16} className="rounded shadow" />
                        <span className="font-medium">English</span>
                      </button>
                      <button 
                        onClick={() => {
                          // Force page reload for mobile translation
                          localStorage.setItem('language', 'it');
                          window.location.reload();
                        }}
                        className={`flex items-center gap-4 w-full px-4 py-3 text-base rounded-lg transition-all duration-200 border ${
                          language === 'it' 
                            ? 'text-white bg-yellow-600 border-yellow-600' 
                            : 'text-gray-900 hover:text-white hover:bg-yellow-600 border-gray-300 bg-white shadow-sm'
                        }`}
                      >
                        <Image src={FLAG_IT} alt="Italiano" width={24} height={16} className="rounded shadow" />
                        <span className="font-medium">Italiano</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t">
                    <AuthButtons inMobileNav user={user} onMobileMenuClose={() => setMobileMenuOpen(false)} />
                </div>
              </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}