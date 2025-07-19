import EventCard from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Map } from "lucide-react";


export default function EventsPage() {
    const events = Array(12).fill({ id: 1, name: "Pebble Beach Concours d'Elegance", date: "August 18, 2024", location: "Pebble Beach, CA", image: "https://placehold.co/600x400.png", hint: "vintage cars" });

    return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold font-headline">Discover Events</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          From local meetups to international shows, find your next car adventure.
        </p>
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
