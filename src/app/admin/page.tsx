"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Car, Gavel, Hotel, Users, Settings, Handshake, Mail, CreditCard } from "lucide-react";
import Link from "next/link";

interface NotificationCounts {
  events: number;
  cars: number;
  auctions: number;
  hotels: number;
  clubs: number;
  services: number;
  partners: number;
  newsletters: number;
  payments: number;
}

export default function AdminDashboard() {
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    events: 0,
    cars: 0,
    auctions: 0,
    hotels: 0,
    clubs: 0,
    services: 0,
    partners: 0,
    newsletters: 0,
    payments: 0
  });
  const [loading, setLoading] = useState(true);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchNotificationCounts = async () => {
      setLoading(true);
      try {
        // Fetch pending events
        const pendingEventsSnapshot = await getDocs(collection(db, "pendingEvents"));
        const pendingEventsCount = pendingEventsSnapshot.size;

        // Fetch pending cars
        const pendingCarsSnapshot = await getDocs(collection(db, "pendingCars"));
        const pendingCarsCount = pendingCarsSnapshot.size;

        // Fetch pending auctions
        const pendingAuctionsSnapshot = await getDocs(collection(db, "pendingAuctions"));
        const pendingAuctionsCount = pendingAuctionsSnapshot.size;

        // Fetch pending hotels
        const pendingHotelsSnapshot = await getDocs(collection(db, "pendingHotels"));
        const pendingHotelsCount = pendingHotelsSnapshot.size;

        // Fetch pending clubs
        const pendingClubsSnapshot = await getDocs(collection(db, "pendingClubs"));
        const pendingClubsCount = pendingClubsSnapshot.size;

        // Fetch pending services
        const pendingServicesSnapshot = await getDocs(collection(db, "pendingOthers"));
        const pendingServicesCount = pendingServicesSnapshot.size;

        // Fetch pending partners
        const pendingPartnersSnapshot = await getDocs(collection(db, "pendingPartners"));
        const pendingPartnersCount = pendingPartnersSnapshot.size;

        // Fetch pending newsletter requests
        const newsletterRequestsSnapshot = await getDocs(query(collection(db, "newsletterrequests"), where("status", "==", "pending")));
        const pendingNewslettersCount = newsletterRequestsSnapshot.size;

        // Fetch recent payments (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const paymentsSnapshot = await getDocs(query(collection(db, "payments"), where("createdAt", ">=", oneDayAgo)));
        const recentPaymentsCount = paymentsSnapshot.size;

        setNotificationCounts({
          events: pendingEventsCount,
          cars: pendingCarsCount,
          auctions: pendingAuctionsCount,
          hotels: pendingHotelsCount,
          clubs: pendingClubsCount,
          services: pendingServicesCount,
          partners: pendingPartnersCount,
          newsletters: pendingNewslettersCount,
          payments: recentPaymentsCount
        });
      } catch (error) {
        console.error("Error fetching notification counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationCounts();
  }, [db]);

  const totalNotifications = Object.values(notificationCounts).reduce((sum, count) => sum + count, 0);

  const notificationCards = [
    {
      title: "Event Requests",
      count: notificationCounts.events,
      icon: Calendar,
      href: "/admin/events",
      color: "bg-blue-500"
    },
    {
      title: "Cars for Sale",
      count: notificationCounts.cars,
      icon: Car,
      href: "/admin/cars",
      color: "bg-green-500"
    },
    {
      title: "Auction Requests",
      count: notificationCounts.auctions,
      icon: Gavel,
      href: "/admin/auctions",
      color: "bg-purple-500"
    },
    {
      title: "Hotel Submissions",
      count: notificationCounts.hotels,
      icon: Hotel,
      href: "/admin/hotels",
      color: "bg-orange-500"
    },
    {
      title: "Club Registrations",
      count: notificationCounts.clubs,
      icon: Users,
      href: "/admin/clubs",
      color: "bg-pink-500"
    },
    {
      title: "Service Requests",
      count: notificationCounts.services,
      icon: Settings,
      href: "/admin/others",
      color: "bg-indigo-500"
    },
    {
      title: "Partner Applications",
      count: notificationCounts.partners,
      icon: Handshake,
      href: "/admin/partners",
      color: "bg-teal-500"
    },
    {
      title: "Newsletter Requests",
      count: notificationCounts.newsletters,
      icon: Mail,
      href: "/admin/newsletter-requests",
      color: "bg-red-500"
    },
    {
      title: "Recent Payments",
      count: notificationCounts.payments,
      icon: CreditCard,
      href: "/admin/payments",
      color: "bg-emerald-500"
    }
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
        {totalNotifications > 0 && (
          <Badge variant="destructive" className="text-sm">
            {totalNotifications} new notifications
          </Badge>
        )}
      </div>
      
      {loading ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">Loading...</h3>
            <p className="text-sm text-muted-foreground">
              Fetching notifications and requests.
            </p>
          </div>
        </div>
      ) : totalNotifications === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
              You have no new notifications
            </h3>
            <p className="text-sm text-muted-foreground">
              Check back later to see new submissions and requests.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notificationCards.map((card) => (
            <Card key={card.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`p-2 rounded-full ${card.color}`}>
                  <card.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.count}</div>
                <p className="text-xs text-muted-foreground">
                  {card.count === 1 ? 'pending request' : 'pending requests'}
                </p>
                {card.count > 0 && (
                  <Button asChild size="sm" className="mt-2 w-full">
                    <Link href={card.href}>
                      View {card.title}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
