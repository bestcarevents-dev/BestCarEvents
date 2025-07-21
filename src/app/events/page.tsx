import EventCard from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Map, PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";


export default function EventsPage() {
    const events = [
      { id: 1, name: "Pebble Beach Concours d'Elegance", date: "August 18, 2024", location: "Pebble Beach, CA", image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", hint: "vintage cars" },
      { id: 2, name: "The Quail, A Motorsports Gathering", date: "August 16, 2024", location: "Carmel, CA", image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", hint: "sports cars grass" },
      { id: 3, name: "Goodwood Festival of Speed", date: "July 11-14, 2024", location: "Goodwood, UK", image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", hint: "race track cars" },
      { id: 4, name: "Rolex Monterey Motorsports Reunion", date: "August 14-17, 2024", location: "Monterey, CA", image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", hint: "vintage race car" },
      { id: 5, name: "Concours of Elegance", date: "Aug 30 - Sep 1, 2024", location: "Hampton Court, UK", image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", hint: "classic cars" },
      { id: 6, name: "Supercar Owners Circle", date: "September 4-8, 2024", location: "Andermatt, CH", image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", hint: "supercar lineup" },
      { id: 7, name: "Cars & Coffee", date: "Every First Sunday", location: "Your Local Town", image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", hint: "muscle cars" },
      { id: 8, name: "Le Mans Classic", date: "July 3-6, 2025", location: "Le Mans, FR", image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", hint: "classic racing" },
      { id: 9, name: "SEMA Show", date: "November 5-8, 2024", location: "Las Vegas, NV", image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", hint: "modified cars" },
      { id: 10, name: "Tokyo Auto Salon", date: "January 10-12, 2025", location: "Chiba, JP", image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", hint: "japanese cars" },
      { id: 11, name: "Daytona 500", date: "February 16, 2025", location: "Daytona Beach, FL", image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", hint: "nascar racing" },
      { id: 12, name: "Indy 500", date: "May 25, 2025", location: "Indianapolis, IN", image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", hint: "indy car" }
    ];

    return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
            <div className="text-center md:text-left mb-4 md:mb-0">
                <h1 className="text-4xl md:text-5xl font-extrabold font-headline">Discover Events</h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                From local meetups to international shows, find your next car adventure.
                </p>
            </div>
            <Button asChild>
                <Link href="/events/host" className="flex items-center">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Host an Event
                </Link>
            </Button>
        </div>

      <div className="bg-card p-6 rounded-lg border mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input placeholder="Search by name, city..." className="md:col-span-2" />
          <Select>
             <SelectTrigger><SelectValue placeholder="Category: Any" /></SelectTrigger>
             <SelectContent>
                <SelectItem value="show">Car Show</SelectItem>
                <SelectItem value="meetup">Meetup</SelectItem>
                <SelectItem value="track">Track Day</SelectItem>
             </SelectContent>
          </Select>
          <Select>
            <SelectTrigger><SelectValue placeholder="Sort by: Date" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
            </SelectContent>
          </Select>
          <Button>Search</Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <div className="flex justify-end mb-4">
            <TabsList>
                <TabsTrigger value="list"><List className="mr-2 h-4 w-4"/>List View</TabsTrigger>
                <TabsTrigger value="map"><Map className="mr-2 h-4 w-4"/>Map View</TabsTrigger>
            </TabsList>
        </div>
        <TabsContent value="list">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {events.map((event, index) => (
                    <EventCard key={index} {...event} name={`${event.name} #${index + 1}`} />
                ))}
            </div>
             <div className="mt-12">
                <Pagination>
                <PaginationContent>
                    <PaginationItem>
                    <PaginationPrevious href="#" />
                    </PaginationItem>
                    <PaginationItem>
                    <PaginationLink href="#">1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                    <PaginationLink href="#" isActive>2</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                    <PaginationLink href="#">3</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                    <PaginationNext href="#" />
                    </PaginationItem>
                </PaginationContent>
                </Pagination>
            </div>
        </TabsContent>
        <TabsContent value="map">
            <Card>
                <CardContent className="p-0">
                    <div className="aspect-video w-full bg-muted flex items-center justify-center">
                        <p>Map view placeholder</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
