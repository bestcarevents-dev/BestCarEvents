"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CircleUser,
  Home,
  Menu,
  Package,
  Package2,
  Search,
  ShoppingCart,
  Users,
  Car,
  Calendar,
  Gavel,
  Hotel,
  Handshake,
  Mail,
  Star,
  Settings,
  CreditCard
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getFirestore, collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";

const NAV_SECTIONS = [
  {
    title: "Submissions & Moderation",
    items: [
      { href: "/admin/events", icon: Calendar, label: "Event Requests" },
      { href: "/admin/cars", icon: Car, label: "Cars for Sale" },
      { href: "/admin/auctions", icon: Gavel, label: "Auction Requests" },
      { href: "/admin/hotels", icon: Hotel, label: "Hotel Submissions" },
      { href: "/admin/clubs", icon: Users, label: "Club Registrations" },
      { href: "/admin/others", icon: Settings, label: "Service Requests" },
      { href: "/admin/partners", icon: Handshake, label: "Partner Applications" },
      { href: "/admin/forum", icon: Settings, label: "Forum Moderation" },
    ],
  },
  {
    title: "Users & Communication",
    items: [
      { href: "/admin/users", icon: Users, label: "Manage Users" },
      { href: "/admin/contact-requests", icon: Mail, label: "Contact Requests" },
      { href: "/admin/newsletter", icon: Mail, label: "Newsletter" },
      { href: "/admin/newsletter-requests", icon: Mail, label: "Newsletter Requests" },
    ],
  },
  {
    title: "Advertising & Commerce",
    items: [
      { href: "/admin/featured", icon: Star, label: "Advertisements" },
      { href: "/admin/ad-edit-notifications", icon: Bell, label: "Ad Edit Notifications" },
      { href: "/admin/payments", icon: CreditCard, label: "Payments" },
      { href: "/admin/coupons", icon: CreditCard, label: "Coupons" },
      { href: "/admin/pricing", icon: CreditCard, label: "Pricing" },
      { href: "/admin/free-listings", icon: Settings, label: "Free Listings" },
    ],
  },
  {
    title: "Content & CMS",
    items: [
      { href: "/admin/homepage", icon: Settings, label: "Homepage Content" },
      { href: "/admin/section-galleries", icon: Settings, label: "Section Galleries" },
      { href: "/admin/page-content", icon: Settings, label: "Page Content" },
      { href: "/admin/static-pages", icon: Settings, label: "Static Pages" },
      { href: "/admin/static-pages#privacy", icon: Settings, label: "Privacy Policy" },
      { href: "/admin/auth-images", icon: Settings, label: "Auth Images" },
      { href: "/admin/interests", icon: Settings, label: "Interests" },
      { href: "/admin/form-preferences", icon: Settings, label: "Form Preferences" },
      { href: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [counts, setCounts] = useState<{
    events: number;
    cars: number;
    auctions: number;
    hotels: number;
    clubs: number;
    services: number;
    partners: number;
    newsletters: number;
    contact: number;
    adEdits: number;
  }>({ events: 0, cars: 0, auctions: 0, hotels: 0, clubs: 0, services: 0, partners: 0, newsletters: 0, contact: 0, adEdits: 0 });

  // Auth + role check: ensure we have both auth and user query result before allowing access
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u || !u.email) {
        setIsAdmin(false);
        setCheckingAccess(false);
        return;
      }
      try {
        const db = getFirestore(app);
        const qUsers = query(collection(db, "users"), where("email", "==", u.email));
        const snap = await getDocs(qUsers);
        let allowed = false;
        snap.forEach((d) => {
          const data = d.data() as any;
          if (data?.userType === "admin") allowed = true;
        });
        setIsAdmin(allowed);
      } catch (e) {
        console.error("Failed to verify admin access", e);
        setIsAdmin(false);
      } finally {
        setCheckingAccess(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Redirect non-admins only after checks are complete
  useEffect(() => {
    if (checkingAccess) return;
    if (isAdmin === false) {
      try { router.replace("/"); } catch {}
    }
  }, [checkingAccess, isAdmin, router]);

  useEffect(() => {
    // Only attach subscriptions after admin access is confirmed
    if (isAdmin !== true) return;
    const db = getFirestore(app);
    const unsubscribers: Array<() => void> = [];
    try {
      const collectionsToWatch: Array<[string, keyof typeof counts]> = [
        ["pendingEvents", "events"],
        ["pendingCars", "cars"],
        ["pendingAuctions", "auctions"],
        ["pendingHotels", "hotels"],
        ["pendingClubs", "clubs"],
        ["pendingOthers", "services"],
        ["pendingPartners", "partners"],
      ];

      for (const [colName, key] of collectionsToWatch) {
        const unsub = onSnapshot(collection(db, colName), (snap) => {
          setCounts((prev) => ({ ...prev, [key]: snap.size }));
        });
        unsubscribers.push(unsub);
      }

      // contact requests unread count
      const unsubContact = onSnapshot(query(collection(db, "contactRequests"), where("read", "==", false)), (snap) => {
        setCounts((prev) => ({ ...prev, contact: snap.size }));
      });
      unsubscribers.push(unsubContact);

      // partner ad edit notifications unread count
      const unsubAdEdits = onSnapshot(query(collection(db, "notifications"), where("type", "==", "partner_ad_edit")), (snap) => {
        const unread = snap.docs.filter((d) => (d.data() as any)?.status !== 'read').length;
        setCounts((prev) => ({ ...prev, adEdits: unread }));
      });
      unsubscribers.push(unsubAdEdits);
    } catch (e) {
      console.error("Failed to subscribe admin sidebar counts", e);
    }
    return () => {
      unsubscribers.forEach((u) => {
        try { u(); } catch {}
      });
    };
  }, [isAdmin]);

  const getBadgeCount = (href: string) => {
    switch (href) {
      case "/admin/events":
        return counts.events;
      case "/admin/cars":
        return counts.cars;
      case "/admin/auctions":
        return counts.auctions;
      case "/admin/hotels":
        return counts.hotels;
      case "/admin/clubs":
        return counts.clubs;
      case "/admin/others":
        return counts.services;
      case "/admin/partners":
        return counts.partners;
      case "/admin/newsletter-requests":
        return 0;
      case "/admin/contact-requests":
        return counts.contact;
      case "/admin/ad-edit-notifications":
        return counts.adEdits;
      default:
        return 0;
    }
  };

  // Loader while verifying access (prevents premature redirects for valid admins)
  if (checkingAccess || isAdmin !== true) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Checking admin access...</div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" />
              <span className="">BestCarEvents</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Link
                href="/admin"
                className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {
                  "bg-muted text-primary": pathname === "/admin"
                })}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              {NAV_SECTIONS.map((section) => (
                <div key={section.title} className="mt-4">
                  <div className="px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground/80">{section.title}</div>
                  {section.items.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {
                        "bg-muted text-primary": pathname === link.href || pathname.startsWith(link.href)
                      })}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                      {getBadgeCount(link.href) > 0 && (
                        <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                          {getBadgeCount(link.href)}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              ))}
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
                  <Package2 className="h-6 w-6" />
                  <span className="sr-only">BestCarEvents</span>
                </Link>
                <Link
                  href="/admin"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <Home className="h-5 w-5" />
                  Dashboard
                </Link>
                {NAV_SECTIONS.map((section) => (
                  <div key={section.title} className="mt-3">
                    <div className="px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground/80">{section.title}</div>
                    {section.items.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                      >
                        <link.icon className="h-5 w-5" />
                        {link.label}
                        {getBadgeCount(link.href) > 0 && (
                          <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                            {getBadgeCount(link.href)}
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
        </main>
      </div>
    </div>
  )
}
