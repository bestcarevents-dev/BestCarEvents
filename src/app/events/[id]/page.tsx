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
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

// This is a mock component for displaying event details.
// In a real application, you would fetch the event data based on the ID.

export default function EventDetailsPage({ params }: { params: { id: string } }) {
    const [event, setEvent] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [registering, setRegistering] = useState(false);
    const [registerSuccess, setRegisterSuccess] = useState(false);
    const router = useRouter();

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
        return <div className="container mx-auto py-24 text-center text-2xl font-bold animate-pulse">Loading event details...</div>;
    }
    if (!event) {
        return <div className="container mx-auto py-24 text-center text-destructive text-2xl font-bold flex flex-col items-center"><Car className="w-12 h-12 mb-4 animate-spin" />Event not found.</div>;
    }

    // Helper function to split comma-separated strings
    const splitString = (str: string): string[] => str ? str.split(',').map((item: string) => item.trim()) : [];

    const scheduleItems = splitString(event.scheduleHighlights);
    const activityItems = splitString(event.activities);
    const sponsorItems = splitString(event.sponsors);

    return (
        <div className="container mx-auto px-4 py-10 bg-white animate-fade-in">
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-10 group">
                <div className="relative w-full aspect-video bg-black">
                    <Image src={event.imageUrl || 'https://via.placeholder.com/900x500?text=No+Image'} alt={event.eventName} fill className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>
                <div className="absolute left-0 bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-white drop-shadow-lg animate-pop-in">{event.eventName}</h1>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <Badge className="bg-yellow-600 text-white animate-bounce-in">{event.eventType}</Badge>
                            {event.vehicleFocus && <Badge className="bg-yellow-500 text-white animate-bounce-in">{event.vehicleFocus}</Badge>}
                        </div>
                    </div>
                    <div className="flex flex-col md:items-end gap-2">
                        {event.location && <span className="text-xl font-mono font-bold text-yellow-600 drop-shadow-lg">{event.location}</span>}
                        <Button size="lg" className="mt-2 animate-pop" onClick={() => router.push('/events')}><ArrowLeft className="mr-2" />Back to Events</Button>
                    </div>
                </div>
            </div>
            {/* Timeline/Quick Info Section */}
            <div className="flex flex-col md:flex-row gap-8 mb-10 items-center justify-center animate-fade-in-up">
                <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-lg px-8 py-6 animate-pop-in">
                    <Calendar className="w-5 h-5 text-yellow-600 mb-2" />
                    <div className="text-lg font-semibold text-yellow-600 mb-1">Date</div>
                    <div className="text-xl font-bold text-gray-900">{event.eventDate?.seconds ? new Date(event.eventDate.seconds * 1000).toLocaleDateString() : event.eventDate || event.date}</div>
                </div>
                <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-lg px-8 py-6 animate-pop-in">
                    <MapPin className="w-5 h-5 text-yellow-600 mb-2" />
                    <div className="text-lg font-semibold text-yellow-600 mb-1">Location</div>
                    <div className="text-xl font-bold text-gray-900">{event.location}</div>
                </div>
                <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-lg px-8 py-6 animate-pop-in">
                    <Tag className="w-5 h-5 text-yellow-600 mb-2" />
                    <div className="text-lg font-semibold text-yellow-600 mb-1">Type</div>
                    <div className="text-xl font-bold text-gray-900">{event.eventType}</div>
                </div>
                {event.expectedAttendance && (
                    <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-lg px-8 py-6 animate-pop-in">
                        <Users className="w-5 h-5 text-yellow-600 mb-2" />
                        <div className="text-lg font-semibold text-yellow-600 mb-1">Expected Attendance</div>
                        <div className="text-xl font-bold text-gray-900">{event.expectedAttendance}</div>
                    </div>
                )}
                {event.entryFee !== undefined && (
                    <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-lg px-8 py-6 animate-pop-in">
                        <DollarSign className="w-5 h-5 text-yellow-600 mb-2" />
                        <div className="text-lg font-semibold text-yellow-600 mb-1">Entry Fee</div>
                        <div className="text-xl font-bold text-gray-900">{event.entryFee === 0 ? 'Free' : `$${event.entryFee}`}</div>
                    </div>
                )}
            </div>
            {/* Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Details */}
                <div className="md:col-span-2 space-y-8">
                    <Card className="p-6 animate-fade-in-up bg-white border border-gray-200">
                        <CardContent className="p-0">
                            <h2 className="text-2xl font-bold font-headline mb-4 text-yellow-600">Event Description</h2>
                            <div className="prose max-w-none text-lg text-gray-600 mb-2 whitespace-pre-line">{event.description}</div>
                        </CardContent>
                    </Card>
                    {scheduleItems.length > 0 && (
                        <Card className="p-6 animate-fade-in-up bg-white border border-gray-200">
                            <CardContent className="p-0">
                                <h2 className="text-2xl font-bold font-headline mb-4 text-yellow-600">Schedule Highlights</h2>
                                <div className="space-y-4">
                                    {scheduleItems.map((item: string, index: number) => (
                                        <div key={index} className="flex items-start text-lg">
                                            <Clock className="mr-3 h-6 w-6 text-yellow-600 flex-shrink-0" />
                                            <p className="text-gray-600">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {activityItems.length > 0 && (
                        <Card className="p-6 animate-fade-in-up bg-white border border-gray-200">
                            <CardContent className="p-0">
                                <h2 className="text-2xl font-bold font-headline mb-4 text-yellow-600">Activities</h2>
                                <div className="flex flex-wrap gap-4">
                                    {activityItems.map((activity: string, index: number) => (
                                        <span key={index} className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">{activity}</span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {sponsorItems.length > 0 && (
                        <Card className="p-6 animate-fade-in-up bg-white border border-gray-200">
                            <CardContent className="p-0">
                                <h2 className="text-2xl font-bold font-headline mb-4 text-yellow-600">Sponsors</h2>
                                <div className="flex flex-wrap gap-4">
                                    {sponsorItems.map((sponsor: string, index: number) => (
                                        <span key={index} className="bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded">{sponsor}</span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
                {/* Quick Info */}
                <div className="space-y-8">
                    <Card className="p-6 animate-fade-in-up bg-white border border-gray-200">
                        <CardContent className="p-0">
                            <h2 className="text-xl font-bold font-headline mb-4 text-yellow-600">Organizer & Contact</h2>
                            <div className="mb-2"><span className="font-semibold text-gray-900 !text-gray-900">Organizer:</span> <span className="text-gray-900">{event.organizerName}</span></div>
                            <div className="mb-2"><span className="font-semibold text-gray-900 !text-gray-900">Contact:</span> <a href={`mailto:${event.organizerContact}?subject=Inquiry about ${event.eventName}`} className="text-yellow-600 underline">{event.organizerContact}</a></div>
                        </CardContent>
                    </Card>
                    {(event.rulesUrl || event.websiteUrl) && (
                        <Card className="p-6 animate-fade-in-up bg-white border border-gray-200">
                            <CardContent className="p-0">
                                <h2 className="text-xl font-bold font-headline mb-4 text-yellow-600">More Information</h2>
                                <div className="flex flex-wrap gap-4">
                                    {event.rulesUrl && (
                                        <Button asChild variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                                            <a href={event.rulesUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                                <LinkIcon className="mr-2 h-5 w-5"/> Rules and Regulations
                                            </a>
                                        </Button>
                                    )}
                                    {event.websiteUrl && (
                                        <Button asChild variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                                            <a href={event.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                                <Building2 className="mr-2 h-5 w-5"/> Event Website
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
            {/* Floating Registration Button */}
            <div className="fixed bottom-8 right-8 z-50 animate-fade-in-up">
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="rounded-full shadow-2xl animate-pop">Register Now!</Button>
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
                                        <p className="text-gray-600 mb-4">Event: <span className="font-bold">{event.eventName}</span></p>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button>
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
                                <p className="text-lg font-semibold mb-2 text-red-600">Please login to register for this event.</p>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">Close</Button>
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
    );
}
