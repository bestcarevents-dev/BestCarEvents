"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Tag, Users, DollarSign, Clock, LinkIcon, Building2, Car } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

// This is a mock component for displaying event details.
// In a real application, you would fetch the event data based on the ID.

export default function EventDetailsPage({ params }: { params: { id: string } }) {
    const [event, setEvent] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [registering, setRegistering] = useState(false);
    const [registerSuccess, setRegisterSuccess] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            setLoading(true);
            const db = getFirestore(app);
            const ref = doc(db, 'events', params.id);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                setEvent({ id: snap.id, ...snap.data() });
            } else {
                setEvent(null);
            }
            setLoading(false);
        };
        fetchEvent();
    }, [params.id]);

    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    const handleRegister = async () => {
        if (!currentUser) return;
        setRegistering(true);
        try {
            const db = getFirestore(app);
            const eventRef = doc(db, 'events', params.id);
            // Fetch latest event data to check for duplicates
            const snap = await getDoc(eventRef);
            if (!snap.exists()) throw new Error('Event not found');
            const data = snap.data();
            const attendees = Array.isArray(data.attendees) ? data.attendees : [];
            const alreadyRegistered = attendees.some((a: any) => a.uid === currentUser.uid);
            if (alreadyRegistered) {
                setRegisterSuccess(true);
                setRegistering(false);
                return;
            }
            await updateDoc(eventRef, {
                attendees: arrayUnion({ uid: currentUser.uid, email: currentUser.email })
            });
            setRegisterSuccess(true);
        } catch (err) {
            alert('Registration failed. Please try again.');
        } finally {
            setRegistering(false);
        }
    };

    if (loading) {
        return <div className="py-12 text-center text-muted-foreground">Loading event...</div>;
    }
    if (!event) {
        return <div className="py-12 text-center text-muted-foreground">Event not found</div>;
    }

    // Helper function to split comma-separated strings
    const splitString = (str: string): string[] => str ? str.split(',').map((item: string) => item.trim()) : [];

    const scheduleItems = splitString(event.scheduleHighlights);
    const activityItems = splitString(event.activities);
    const sponsorItems = splitString(event.sponsors);

    return (
        <>
            <div className="container mx-auto px-4 py-12">
                <Card className="overflow-hidden">
                    {/* Enhanced Hero Section */}
                    <div className="relative w-full h-96 flex items-center justify-center">
                        <Image src={event.imageUrl} alt={event.eventName} width={1200} height={384} className="object-cover w-full h-96" priority />
                         <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center text-white p-6"> {/* Adjusted overlay and content centering */}
                             <h1 className="text-5xl md:text-6xl font-bold font-headline text-shadow-lg animate-fade-in-down">{event.eventName}</h1>
                             {event.subtitle && <p className="text-xl md:text-2xl text-shadow-lg mt-4 animate-fade-in-up">{event.subtitle}</p>}
                             {/* Call to Action Button */}
                             <Dialog open={showDialog} onOpenChange={setShowDialog}>
                               <DialogTrigger asChild>
                             <Button className="mt-8 text-lg animate-pulse">Register Now!</Button>
                               </DialogTrigger>
                               <DialogContent className="max-w-md w-full">
                                 <DialogHeader>
                                   <DialogTitle>Event Registration</DialogTitle>
                                 </DialogHeader>
                                 {currentUser ? (
                                   <div className="py-4 text-center">
                                     {registerSuccess ? (
                                       <>
                                         <p className="text-lg font-semibold mb-2 text-green-600">You are registered for this event!</p>
                                         <DialogFooter>
                                           <DialogClose asChild>
                                             <Button variant="default">Close</Button>
                                           </DialogClose>
                                         </DialogFooter>
                                       </>
                                     ) : (
                                       <>
                                         <p className="text-lg font-semibold mb-2">Are you sure you want to register for this event?</p>
                                         <p className="text-muted-foreground mb-4">Event: <span className="font-bold">{event.eventName}</span></p>
                                         <DialogFooter>
                                           <DialogClose asChild>
                                             <Button variant="outline">Cancel</Button>
                                           </DialogClose>
                                           <Button onClick={handleRegister} disabled={registering}>
                                             {registering ? 'Registering...' : 'Confirm Registration'}
                                           </Button>
                                         </DialogFooter>
                                       </>
                                     )}
                                   </div>
                                 ) : (
                                   <div className="py-4 text-center">
                                     <p className="text-lg font-semibold mb-2 text-destructive">Please login to register for this event.</p>
                                     <DialogFooter>
                                       <DialogClose asChild>
                                         <Button variant="outline">Close</Button>
                                       </DialogClose>
                                       <Button asChild variant="default">
                                         <a href="/login">Login</a>
                                       </Button>
                                     </DialogFooter>
                                   </div>
                                 )}
                               </DialogContent>
                             </Dialog>
                         </div>
                    </div>

                    <CardContent className="p-6 space-y-12"> {/* Increased vertical spacing */}
                        {/* Event Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="flex items-center text-gray-300 p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-sm">
                                <Calendar className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Date</p>
                                    <p className="font-medium">{event.eventDate?.seconds ? new Date(event.eventDate.seconds * 1000).toLocaleDateString() : event.eventDate || event.date}</p>
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
                                    {scheduleItems.map((item: string, index: number) => (
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
                                    {activityItems.map((activity: string, index: number) => (
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
                                    {sponsorItems.map((sponsor: string, index: number) => (
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
