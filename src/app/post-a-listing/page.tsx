"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Users, Star, Award, Zap, ArrowRight } from "lucide-react";

const listingOptions = [
  {
    name: "Events",
    description: "Host or promote your car events, meetups, and gatherings.",
    icon: <Calendar className="w-10 h-10" />,
    color: "bg-blue-100 text-blue-600",
    href: "/events/host",
  },
  {
    name: "Clubs",
    description: "Promote your car clubs and connect with enthusiasts.",
    icon: <Users className="w-10 h-10" />,
    color: "bg-green-100 text-green-600",
    href: "/clubs/register",
  },
  {
    name: "Hotels",
    description: "Showcase your hotel services to car lovers and event-goers.",
    icon: <Star className="w-10 h-10" />,
    color: "bg-purple-100 text-purple-600",
    href: "/hotels/list",
  },
  {
    name: "Auctions",
    description: "Feature your car auctions and sales events for maximum reach.",
    icon: <Award className="w-10 h-10" />,
    color: "bg-orange-100 text-orange-600",
    href: "/auctions/submit",
  },
  {
    name: "Other Services",
    description: "Advertise tyre services, detailing, or any car-related business.",
    icon: <Zap className="w-10 h-10" />,
    color: "bg-yellow-100 text-yellow-600",
    href: "/others/register",
  },
];

export default function PostAListingPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4">
            <ArrowRight className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-yellow-600 mb-4 font-headline">Post a Free Listing</h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto font-semibold">
            Choose the type of listing you want to post. Connect with thousands of car enthusiasts, collectors, and service seekers. It's quick, easy, and impactful!
          </p>
        </div>

        {/* Car Listing Pricing Notice */}
        <div className="mb-12 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-yellow-700 mb-4 font-headline">
              🚗 Car Listings - Special Launch Offer!
            </h2>
            <p className="text-lg text-gray-700 mb-6 font-medium">
              Car listings are normally paid, but we're offering them <span className="font-bold text-yellow-600">completely FREE until 31st November 2025</span>!
            </p>
            <Button asChild size="lg" className="font-bold rounded-full bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-4 text-lg">
              <Link href="/cars/sell">
                Post a Free Car Listing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Listing Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {listingOptions.map((option, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-all duration-300 border-2 border-gray-200 hover:border-yellow-300 bg-white flex flex-col justify-between">
              <CardHeader className="text-center flex flex-col items-center">
                <div className={`inline-flex p-4 rounded-full mb-4 ${option.color}`}>{option.icon}</div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">{option.name}</CardTitle>
                <CardDescription className="text-gray-600 mb-4 text-base">{option.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button asChild size="lg" className="font-bold rounded-full bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-4 text-lg w-full">
                  <Link href={option.href}>
                    Post a {option.name} Listing
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 