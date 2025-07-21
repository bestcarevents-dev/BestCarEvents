"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Tag, Users, DollarSign, Clock, LinkIcon, Building2, Car } from 'lucide-react';

// This is a mock component for displaying event details.
// In a real application, you would fetch the event data based on the ID.

const mockEvent = {
    id: 1,
    eventName: "Mock Event Name",
    subtitle: "An unforgettable experience!", // Added subtitle field
    eventDate: "August 30, 2024",
    location: "Mock Location, CA",
    description: "This is a mock event description. It provides details about the event, what to expect, and why you should attend. This section can be quite detailed to include all relevant information about the event activities and highlights.",
    organizerName: "Mock Organizer",
    organizerContact: "mock@example.com",
    imageUrl: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Using the last used image for consistency
    eventType: "Car Show",
    vehicleFocus: "Classic Cars",
    expectedAttendance: 500,
    entryFee: 25,
    scheduleHighlights: `9:00 AM - Gates Open
11:00 AM - Car Judging Begins
3:00 PM - Awards Ceremony`,
    activities: "Live Music, Food Trucks, Vendor Booths",
    rulesUrl: "https://example.com/rules",
    sponsors: "Mock Sponsor A, Mock Sponsor B",
    websiteUrl: "https://example.com/event",
};

export default function EventDetailsPage() {
    // In a real app, get the event ID from the URL and fetch data
    // const router = useRouter();
    // const { id } = router.query;
    // const event = fetchEvent(id); // Replace with your data fetching logic

    const event = mockEvent; // Using mock data for now

    if (!event) {
        return <div>Event not found</div>;
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <Card className="overflow-hidden">
                <div className="relative w-full h-80">
                    <Image src={event.imageUrl} alt={event.eventName} fill className="object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                     <div className="absolute bottom-0 left-0 p-6 text-white">
                         <h1 className="text-4xl font-bold font-headline text-shadow-lg">{event.eventName}</h1>
                         {event.subtitle && <p className="text-xl text-shadow-lg mt-2">{event.subtitle}</p>} {/* Display subtitle */}
                     </div>
                </div>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Modified grid classes */}
                        <div className="flex items-center text-muted-foreground">
                            <Calendar className="mr-3 h-5 w-5" />
                            <span>{event.eventDate}</span>
                        </div>
                         <div className="flex items-center text-muted-foreground">
                            <MapPin className="mr-3 h-5 w-5" />
                            <span>{event.location}</span>
                        </div>
                         <div className="flex items-center text-muted-foreground">
                            <Tag className="mr-3 h-5 w-5" />
                            <span>{event.eventType}</span>
                        </div>
                         {event.vehicleFocus && (
                            <div className="flex items-center text-muted-foreground">
                                <Car className="mr-3 h-5 w-5" />
                                <span>Vehicle Focus: {event.vehicleFocus}</span>
                            </div>
                         )}
                         {event.expectedAttendance && (
                             <div className="flex items-center text-muted-foreground">
                                <Users className="mr-3 h-5 w-5" />
                                <span>Expected Attendance: {event.expectedAttendance}</span>
                            </div>
                         )}
                         {event.entryFee !== undefined && (
                              <div className="flex items-center text-muted-foreground">
                                <DollarSign className="mr-3 h-5 w-5" />
                                <span>Entry Fee: {event.entryFee === 0 ? 'Free' : `$${event.entryFee}`}</span>
                            </div>
                         )}
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold font-headline mb-3">Description</h2>
                        <p className="text-muted-foreground">{event.description}</p>
                    </div>

                     {event.scheduleHighlights && (
                         <div>
                            <h2 className="text-2xl font-bold font-headline mb-3">Schedule Highlights</h2>
                            <p className="text-muted-foreground whitespace-pre-wrap">{event.scheduleHighlights}</p>
                        </div>
                     )}

                     {event.activities && (
                         <div>
                            <h2 className="text-2xl font-bold font-headline mb-3">Activities</h2>
                            <p className="text-muted-foreground">{event.activities}</p>
                        </div>
                     )}

                     {(event.rulesUrl || event.websiteUrl) && (
                         <div>
                             <h2 className="text-2xl font-bold font-headline mb-3">More Information</h2>
                             <div className="flex flex-wrap gap-4">
                                 {event.rulesUrl && (
                                     <Button asChild variant="outline">
                                         <a href={event.rulesUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                             <LinkIcon className="mr-2 h-4 w-4"/> Rules and Regulations
                                         </a>
                                     </Button>
                                 )}
                                 {event.websiteUrl && (
                                     <Button asChild variant="outline">
                                         <a href={event.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                              <Building2 className="mr-2 h-4 w-4"/> Event Website
                                         </a>
                                     </Button>
                                 )}
                             </div>
                         </div>
                     )}

                      {event.sponsors && (
                         <div>
                            <h2 className="text-2xl font-bold font-headline mb-3">Sponsors</h2>
                            <p className="text-muted-foreground">{event.sponsors}</p>
                        </div>
                     )}

                    <div>
                        <h2 className="text-2xl font-bold font-headline mb-3">Organizer</h2>
                        <p className="text-muted-foreground">{event.organizerName} ({event.organizerContact})</p>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
