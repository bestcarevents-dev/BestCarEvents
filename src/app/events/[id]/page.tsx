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
    subtitle: "An unforgettable experience!",
    eventDate: "August 30, 2024",
    location: "Mock Location, CA",
    description: "This is a mock event description. It provides details about the event, what to expect, and why you should attend. This section can be quite detailed to include all relevant information about the event activities and highlights.",
    organizerName: "Mock Organizer",
    organizerContact: "mock@example.com",
    imageUrl: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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

    // Helper function to split comma-separated strings
    const splitString = (str) => str ? str.split(',').map(item => item.trim()) : [];

    const scheduleItems = splitString(event.scheduleHighlights);
    const activityItems = splitString(event.activities);
    const sponsorItems = splitString(event.sponsors);

    return (
        <>
            <div className="container mx-auto px-4 py-12">
                <Card className="overflow-hidden">
                    {/* Enhanced Hero Section */}
                    <div className="relative w-full h-96 flex items-center justify-center">
                        <Image src={event.imageUrl} alt={event.eventName} fill className="object-cover" />
                         <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center text-white p-6"> {/* Adjusted overlay and content centering */}
                             <h1 className="text-5xl md:text-6xl font-bold font-headline text-shadow-lg animate-fade-in-down">{event.eventName}</h1>
                             {event.subtitle && <p className="text-xl md:text-2xl text-shadow-lg mt-4 animate-fade-in-up">{event.subtitle}</p>}
                             {/* Call to Action Button */}
                             <Button className="mt-8 text-lg animate-pulse">Register Now!</Button>
                         </div>
                    </div>

                    <CardContent className="p-6 space-y-12"> {/* Increased vertical spacing */}
                        {/* Event Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="flex items-center text-gray-300 p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-sm">
                                <Calendar className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Date</p>
                                    <p className="font-medium">{event.eventDate}</p>
                                </div>
                            </div>
                             <div className="flex items-center text-gray-300 p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-sm">
                                <MapPin className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Location</p>
                                    <p className="font-medium">{event.location}</p>
                                </div>
                            </div>
                             <div className="flex items-center text-gray-300 p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-sm">
                                <Tag className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" />
                                 <div>
                                    <p className="text-sm text-gray-500">Event Type</p>
                                    <p className="font-medium">{event.eventType}</p>
                                </div>
                            </div>
                             {event.vehicleFocus && (
                                <div className="flex items-center text-gray-300 p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-sm">
                                    <Car className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" />
                                     <div>
                                        <p className="text-sm text-gray-500">Vehicle Focus</p>
                                        <p className="font-medium">{event.vehicleFocus}</p>
                                    </div>
                                </div>
                             )}
                             {event.expectedAttendance && (
                                 <div className="flex items-center text-gray-300 p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-sm">
                                    <Users className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" />
                                     <div>
                                        <p className="text-sm text-gray-500">Expected Attendance</p>
                                        <p className="font-medium">{event.expectedAttendance}</p>
                                    </div>
                                </div>
                             )}
                             {event.entryFee !== undefined && (
                                  <div className="flex items-center text-gray-300 p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-sm">
                                    <DollarSign className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" />
                                     <div>
                                        <p className="text-sm text-gray-500">Entry Fee</p>
                                        <p className="font-medium"><span>{event.entryFee === 0 ? 'Free' : `$${event.entryFee}`}</span></p>
                                    </div>
                                </div>
                             )}
                        </div>

                        {/* Description */}
                        <div>
                            <h2 className="text-3xl font-bold font-headline mb-4">Description</h2>
                            <p className="text-muted-foreground text-lg">{event.description}</p>
                        </div>

                        {/* Schedule Highlights */}
                        {scheduleItems.length > 0 && (
                            <div>
                                <h2 className="text-3xl font-bold font-headline mb-4">Schedule Highlights</h2>
                                <div className="space-y-4">
                                    {scheduleItems.map((item, index) => (
                                        <div key={index} className="flex items-start text-lg">
                                            <Clock className="mr-3 h-6 w-6 text-blue-500 flex-shrink-0" />
                                            <p className="text-muted-foreground">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Activities */}
                        {activityItems.length > 0 && (
                            <div>
                                <h2 className="text-3xl font-bold font-headline mb-4">Activities</h2>
                                <div className="flex flex-wrap gap-4">
                                    {activityItems.map((activity, index) => (
                                        <span key={index} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">{activity}</span>
                                    ))
                                    }
                                </div>
                            </div>
                        )}

                         {/* More Information (Buttons) */}
                         {(event.rulesUrl || event.websiteUrl) && (
                             <div>
                                 <h2 className="text-3xl font-bold font-headline mb-4">More Information</h2>
                                 <div className="flex flex-wrap gap-4">
                                     {event.rulesUrl && (
                                         <Button asChild variant="outline" size="lg">
                                             <a href={event.rulesUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                                 <LinkIcon className="mr-2 h-5 w-5"/> Rules and Regulations
                                             </a>
                                         </Button>
                                     )}
                                     {event.websiteUrl && (
                                         <Button asChild variant="outline" size="lg">
                                             <a href={event.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                                  <Building2 className="mr-2 h-5 w-5"/> Event Website
                                             </a>
                                         </Button>
                                     )}
                                 </div>
                             </div>
                         )}

                        {/* Sponsors */}
                          {sponsorItems.length > 0 && (
                             <div>
                                <h2 className="text-3xl font-bold font-headline mb-4">Sponsors</h2>
                                <div className="flex flex-wrap gap-4">
                                    {sponsorItems.map((sponsor, index) => (
                                        <span key={index} className="bg-gray-200 text-gray-800 text-sm font-medium px-3 py-1 rounded">{sponsor}</span>
                                    ))
                                    }
                                </div>
                            </div>
                         )}

                        {/* Organizer */}
                        <div>
                            <h2 className="text-3xl font-bold font-headline mb-4">Organizer</h2>
                            <p className="text-muted-foreground text-lg">{event.organizerName} ({event.organizerContact})</p>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </>
    );
}
