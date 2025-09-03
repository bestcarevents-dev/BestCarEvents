"use client";

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
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
    { href: "/admin/events", icon: Calendar, label: "Event Requests", badge: 5 },
    { href: "/admin/cars", icon: Car, label: "Cars for Sale" },
    { href: "/admin/auctions", icon: Gavel, label: "Auction Requests" },
    { href: "/admin/hotels", icon: Hotel, label: "Hotel Submissions" },
    { href: "/admin/clubs", icon: Users, label: "Club Registrations" },
    { href: "/admin/others", icon: Settings, label: "Service Requests" },
    { href: "/admin/partners", icon: Handshake, label: "Partner Applications" },
    { href: "/admin/users", icon: Users, label: "Manage Users" },
    { href: "/admin/newsletter", icon: Mail, label: "Newsletter" },
    { href: "/admin/newsletter-requests", icon: Mail, label: "Newsletter Requests" },
    { href: "/admin/payments", icon: CreditCard, label: "Payments" },
    { href: "/admin/free-listings", icon: Settings, label: "Free Listings" },
    { href: "/admin/forum", icon: Settings, label: "Forum Moderation" },
    { href: "/admin/homepage", icon: Settings, label: "Homepage Content" },
    { href: "/admin/section-galleries", icon: Settings, label: "Section Galleries" },
    { href: "/admin/page-content", icon: Settings, label: "Page Content" },
    { href: "/admin/interests", icon: Settings, label: "Interests" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
               {navLinks.map(link => (
                 <Link
                    key={link.href}
                    href={link.href}
                    className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {
                      "bg-muted text-primary": link.href === "/admin/newsletter" || link.href === "/admin/newsletter-requests" 
                        ? pathname === link.href 
                        : pathname.startsWith(link.href)
                    })}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                    {link.badge && <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">{link.badge}</Badge>}
                  </Link>
               ))}
              <Link
                href="/admin/featured"
                className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", {
                  "bg-muted text-primary": pathname.startsWith("/admin/featured")
                })}
              >
                <Star className="h-4 w-4" />
                Adertisements
              </Link>
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
                {navLinks.map(link => (
                 <Link
                    key={link.href}
                    href={link.href}
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                     {link.badge && <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">{link.badge}</Badge>}
                  </Link>
               ))}
                <Link
                  href="/admin/featured"
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <Star className="h-5 w-5" />
                  Featured
                </Link>
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
