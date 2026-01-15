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
import { useLuxuryLightbox } from '@/components/LuxuryLightboxProvider';
import { ArrowLeft } from 'lucide-react';

// This is a mock component for displaying event details.
// In a real application, you would fetch the event data based on the ID.

export default function EventDetailsPage({ params }: { params: { id: string } }) {
    const [event, setEvent] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const lightbox = useLuxuryLightbox();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [registering, setRegistering] = useState(false);
    const [registerSuccess, setRegisterSuccess] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchEvent = async () => {
            // Validate id before fetching
            if (!params?.id || typeof params.id !== 'string' || params.id.trim() === '') {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const db = getFirestore(app);
                const ref = doc(db, 'events', params.id);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    setEvent({ id: snap.id, ...snap.data() });
                } else {
                    setEvent(null);
                }
            } catch (error) {
                console.error("Error fetching event:", error);
                setEvent(null);
            } finally {
                setLoading(false);
            }
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

            // Fire-and-forget email to event owner (non-blocking)
            try {
                const ownerEmail = (data as any)?.uploadedByUserEmail;
                const eventName = (data as any)?.eventName || 'Your event';
                if (ownerEmail && currentUser.email && ownerEmail !== currentUser.email) {
                    fetch('/api/emails/event-registration', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ to: ownerEmail, eventName, attendeeEmail: currentUser.email })
                    }).catch(() => {});
                }
            } catch {}
            setRegisterSuccess(true);
        } catch (err) {
            alert('Registration failed. Please try again.');
        } finally {
            setRegistering(false);
        }
    };

    // Handle invalid or missing ID
    if (!params?.id) {
        return <div className="container mx-auto py-12 sm:py-24 text-center text-red-500 text-xl sm:text-2xl font-bold flex flex-col items-center">
            <Car className="w-8 h-8 sm:w-12 sm:h-12 mb-4" />
            Invalid event ID
        </div>;
    }

    if (loading) {
        return <div className="container mx-auto py-12 sm:py-24 text-center text-xl sm:text-2xl font-bold animate-pulse">Loading event details...</div>;
    }
    
    if (!event) {
        return <div className="container mx-auto py-12 sm:py-24 text-center text-red-500 text-xl sm:text-2xl font-bold flex flex-col items-center">
            <Car className="w-8 h-8 sm:w-12 sm:h-12 mb-4" />
            Event not found
        </div>;
    }

    // Normalize string or array into array of trimmed strings
    const toItems = (value: any): string[] => {
        if (!value) return [];
        if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
        return String(value)
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean);
    };

    const scheduleItems = toItems(event.scheduleHighlights);
    const activityItems = toItems(event.activities);
    const sponsorItems = toItems(event.sponsors);

    return (
        <div className="container mx-auto px-4 py-6 sm:py-10 bg-white animate-fade-in">
            {/* Hero Section */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl mb-2 sm:mb-10 group">
                <div className="relative w-full aspect-video bg-black">
                    <button
                      className="absolute inset-0"
                      aria-label="Open image gallery"
                      onClick={() => lightbox.open([event.imageUrl || 'https://via.placeholder.com/900x500?text=No+Image'], 0)}
                      type="button"
                    >
                      <Image src={event.imageUrl || 'https://via.placeholder.com/900x500?text=No+Image'} alt={event.eventName} fill className="object-contain w-full h-full" unoptimized />
                    </button>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>
                {/* Desktop overlay content; mobile will show details below */}
                <div className="hidden sm:flex absolute left-0 bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-8 flex-col gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-headline text-white drop-shadow-lg animate-pop-in leading-tight">{event.eventName}</h1>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {(Array.isArray(event.eventTypes) && event.eventTypes.length ? event.eventTypes : (event.eventType ? [event.eventType] : [])).map((t: any, i: number) => (
                              <Badge key={String(t)+i} className="bg-yellow-600 text-white animate-bounce-in">{String(t)}</Badge>
                            ))}
                            {event.vehicleFocus && <Badge className="bg-yellow-500 text-white animate-bounce-in">{event.vehicleFocus}</Badge>}
                        </div>
                    </div>
                    <div className="flex items-end justify-between gap-4">
                        {event.location && <span className="text-xl font-mono font-bold text-yellow-600 drop-shadow-lg">{event.privacyMode ? [event.city, event.region].filter(Boolean).join(", ") : event.location}</span>}
                        <Button size="sm" className="mt-2 animate-pop w-fit" onClick={() => router.push('/events')}><ArrowLeft className="mr-2 w-4 h-4" />Back to Events</Button>
                    </div>
                </div>
            </div>
            {/* Mobile title and badges below image to avoid cramped overlay */}
            <div className="sm:hidden mb-6">
                <h1 className="text-2xl font-extrabold font-headline text-gray-900 leading-tight">{event.eventName}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                    {(Array.isArray(event.eventTypes) && event.eventTypes.length ? event.eventTypes : (event.eventType ? [event.eventType] : [])).map((t: any, i: number) => (
                      <Badge key={String(t)+i} className="bg-yellow-600 text-white text-xs">{String(t)}</Badge>
                    ))}
                    {event.vehicleFocus && (
                        <Badge className="bg-yellow-500 text-white text-xs">{event.vehicleFocus}</Badge>
                    )}
                </div>
                <div className="flex items-center justify-between mt-3">
                    {event.location && <span className="text-sm font-mono font-semibold text-yellow-700">{event.privacyMode ? [event.city, event.region].filter(Boolean).join(", ") : event.location}</span>}
                    <Button size="sm" variant="outline" className="border-gray-300 text-gray-700" onClick={() => router.push('/events')}>
                        <ArrowLeft className="mr-2 w-4 h-4" />Back
                    </Button>
                </div>
            </div>

            {/* Timeline/Quick Info Section - Mobile Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-10 animate-fade-in-up">
                <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-lg px-4 sm:px-6 py-4 sm:py-6 animate-pop-in">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mb-2" />
                    <div className="text-sm sm:text-lg font-semibold text-yellow-600 mb-1">Date</div>
                    <div className="text-base sm:text-xl font-bold text-gray-900 text-center">
                      {(() => {
                        const start = event.eventDate?.seconds ? new Date(event.eventDate.seconds * 1000) : (event.eventDate ? new Date(event.eventDate) : null);
                        const end = event.endDate?.seconds ? new Date(event.endDate.seconds * 1000) : (event.endDate ? new Date(event.endDate) : null);
                        if (!start) return event.date || 'TBD';
                        const startStr = start.toLocaleDateString('en-GB');
                        if (!end) return startStr;
                        const endStr = end.toLocaleDateString('en-GB');
                        return `${startStr} - ${endStr}`;
                      })()}
                    </div>
                </div>
                <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-lg px-4 sm:px-6 py-4 sm:py-6 animate-pop-in">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mb-2" />
                    <div className="text-sm sm:text-lg font-semibold text-yellow-600 mb-1">Location</div>
                    <div className="text-base sm:text-xl font-bold text-gray-900 text-center">{event.location}</div>
                </div>
                <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-lg px-4 sm:px-6 py-4 sm:py-6 animate-pop-in">
                    <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mb-2" />
                    <div className="text-sm sm:text-lg font-semibold text-yellow-600 mb-1">Type</div>
                    <div className="text-base sm:text-xl font-bold text-gray-900 text-center">
                      {(Array.isArray(event.eventTypes) && event.eventTypes.length ? event.eventTypes : (event.eventType ? [event.eventType] : []))
                        .map((t: any) => String(t)).join(', ')}
                    </div>
                </div>
                {event.expectedAttendance && (
                    <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-lg px-4 sm:px-6 py-4 sm:py-6 animate-pop-in">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mb-2" />
                        <div className="text-sm sm:text-lg font-semibold text-yellow-600 mb-1">Expected Attendance</div>
                        <div className="text-base sm:text-xl font-bold text-gray-900 text-center">{event.expectedAttendance}</div>
                    </div>
                )}
                {event.entryFee !== undefined && (
                    <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl shadow-lg px-4 sm:px-6 py-4 sm:py-6 animate-pop-in">
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mb-2" />
                        <div className="text-sm sm:text-lg font-semibold text-yellow-600 mb-1">Entry Fee</div>
                        <div className="text-base sm:text-xl font-bold text-gray-900 text-center">{event.entryFee === 0 ? 'Free' : `$${Number(event.entryFee).toLocaleString()}`}</div>
                    </div>
                )}
            </div>

            {/* Details Section - Mobile Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                    <Card className="p-4 sm:p-6 animate-fade-in-up bg-white border border-gray-200">
                        <CardContent className="p-0">
                            <h2 className="text-xl sm:text-2xl font-bold font-headline mb-3 sm:mb-4 text-yellow-600">Event Description</h2>
                            <div className="prose max-w-none text-base sm:text-lg text-gray-600 mb-2 whitespace-pre-line leading-relaxed">{event.description}</div>
                        </CardContent>
                    </Card>
                    {scheduleItems.length > 0 && (
                        <Card className="p-4 sm:p-6 animate-fade-in-up bg-white border border-gray-200">
                            <CardContent className="p-0">
                                <h2 className="text-xl sm:text-2xl font-bold font-headline mb-3 sm:mb-4 text-yellow-600">Schedule Highlights</h2>
                                <div className="space-y-3 sm:space-y-4">
                                    {scheduleItems.map((item: string, index: number) => (
                                        <div key={index} className="flex items-start text-base sm:text-lg">
                                            <Clock className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-gray-600 leading-relaxed">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {activityItems.length > 0 && (
                        <Card className="p-4 sm:p-6 animate-fade-in-up bg-white border border-gray-200">
                            <CardContent className="p-0">
                                <h2 className="text-xl sm:text-2xl font-bold font-headline mb-3 sm:mb-4 text-yellow-600">Activities</h2>
                                <div className="flex flex-wrap gap-2 sm:gap-4">
                                    {activityItems.map((activity: string, index: number) => (
                                        <span key={index} className="bg-yellow-100 text-yellow-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">{activity}</span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {sponsorItems.length > 0 && (
                        <Card className="p-4 sm:p-6 animate-fade-in-up bg-white border border-gray-200">
                            <CardContent className="p-0">
                                <h2 className="text-xl sm:text-2xl font-bold font-headline mb-3 sm:mb-4 text-yellow-600">Sponsors</h2>
                                <div className="flex flex-wrap gap-2 sm:gap-4">
                                    {sponsorItems.map((sponsor: string, index: number) => (
                                        <span key={index} className="bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded">{sponsor}</span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Location Map Section */}
                    {(event.locationData?.latitude && event.locationData?.longitude) || event.location ? (
                      <Card className="p-4 sm:p-6 animate-fade-in-up bg-white border border-gray-200">
                        <CardContent className="p-0 space-y-3">
                          <h2 className="text-xl sm:text-2xl font-bold font-headline mb-2 sm:mb-3 text-yellow-600">Location</h2>
                          {event.location && (
                            <div className="flex items-center gap-2 text-gray-700 text-sm sm:text-base">
                              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                              <span className="font-medium break-words">{event.privacyMode ? [event.city, event.region].filter(Boolean).join(", ") : event.location}</span>
                            </div>
                          )}
                          {event.privacyMode && (
                            <p className="text-sm text-yellow-700">The organizer enabled privacy mode. Contact them for the exact location.</p>
                          )}
                          <div className="w-full overflow-hidden rounded-lg border">
                            {event.locationData?.latitude && event.locationData?.longitude ? (
                              <iframe
                                title="Event location map"
                                src={`https://www.google.com/maps?q=${event.locationData.latitude},${event.locationData.longitude}&z=14&output=embed`}
                                className="w-full h-[320px] sm:h-[360px]"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                              />
                            ) : (
                              <iframe
                                title="Event location map"
                                src={`https://www.google.com/maps?q=${encodeURIComponent(event.location)}&z=14&output=embed`}
                                className="w-full h-[320px] sm:h-[360px]"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                              />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}
                </div>
                {/* Quick Info - Mobile Responsive */}
                <div className="space-y-6 sm:space-y-8">
                    <Card className="p-4 sm:p-6 animate-fade-in-up bg-white border border-gray-200">
                        <CardContent className="p-0">
                            <h2 className="text-lg sm:text-xl font-bold font-headline mb-3 sm:mb-4 text-yellow-600">Organizer & Contact</h2>
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                    <span className="font-semibold text-gray-900 text-sm sm:text-base">Organizer:</span> 
                                    <span className="text-gray-900 text-sm sm:text-base">{event.organizerName}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                    <span className="font-semibold text-gray-900 text-sm sm:text-base">Contact:</span> 
                                    <a href={`mailto:${event.organizerContact}?subject=Inquiry about ${event.eventName}`} className="text-yellow-600 underline text-sm sm:text-base break-all">{event.organizerContact}</a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {(event.rulesUrl || event.websiteUrl) && (
                        <Card className="p-4 sm:p-6 animate-fade-in-up bg-white border border-gray-200">
                            <CardContent className="p-0">
                                <h2 className="text-lg sm:text-xl font-bold font-headline mb-3 sm:mb-4 text-yellow-600">More Information</h2>
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                    {event.rulesUrl && (
                                        <Button asChild variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm">
                                            <a href={event.rulesUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                                                <LinkIcon className="mr-2 h-4 w-4"/> Rules and Regulations
                                            </a>
                                        </Button>
                                    )}
                                    {event.websiteUrl && (
                                        <Button asChild variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm">
                                            <a href={event.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                                                <Building2 className="mr-2 h-4 w-4"/> Event Website
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Floating Registration Button - Mobile Responsive */}
            <div className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 z-50 animate-fade-in-up">
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="rounded-full shadow-2xl animate-pop text-sm sm:text-base px-4 sm:px-6">Register Now!</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md w-[90vw] sm:w-full mx-4">
                        <DialogHeader>
                            <DialogTitle className="text-lg sm:text-xl">Event Registration</DialogTitle>
                        </DialogHeader>
                        {currentUser ? (
                            <div className="py-4 text-center">
                                {registerSuccess ? (
                                    <>
                                        <p className="text-base sm:text-lg font-semibold mb-2 text-green-600">You are registered for this event!</p>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="default" size="sm">Close</Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-base sm:text-lg font-semibold mb-2">Are you sure you want to register for this event?</p>
                                        <p className="text-gray-600 mb-4 text-sm sm:text-base">Event: <span className="font-bold">{event.eventName}</span></p>
                                        <DialogFooter className="flex flex-col sm:flex-row gap-2">
                                            <DialogClose asChild>
                                                <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button>
                                            </DialogClose>
                                            <Button onClick={handleRegister} disabled={registering} size="sm">
                                                {registering ? 'Registering...' : 'Confirm Registration'}
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="py-4 text-center">
                                <p className="text-base sm:text-lg font-semibold mb-2 text-red-600">Please login to register for this event.</p>
                                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                                    <DialogClose asChild>
                                        <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">Close</Button>
                                    </DialogClose>
                                    <Button asChild variant="default" size="sm">
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
