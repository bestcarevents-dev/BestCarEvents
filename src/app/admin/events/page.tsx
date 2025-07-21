"use client";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface EventRequest {
  id: string;
  eventName: string;
  eventDate: any;
  location: string;
  description: string;
  organizerName: string;
  organizerContact: string;
  imageUrl: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: any;
  
  // New Fields
  eventType?: string;
  vehicleFocus?: string;
  expectedAttendance?: number;
  entryFee?: number;
  scheduleHighlights?: string;
  activities?: string;
  rulesUrl?: string;
  sponsors?: string;
  websiteUrl?: string;
}

export default function PendingEventsPage() {
  const [requests, setRequests] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventRequest | null>(null);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "pendingEvents"));
      const requestsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventRequest));
      setRequests(requestsData);
      setLoading(false);
    };
    fetchRequests();
  }, [db]);

  const handleApprove = async (request: EventRequest) => {
    try {
      // When approving, only transfer the relevant fields to the 'events' collection
      const approvedEventData: Omit<EventRequest, 'id' | 'status' | 'submittedAt'> = {
          eventName: request.eventName,
          eventDate: request.eventDate,
          location: request.location,
          description: request.description,
          organizerName: request.organizerName,
          organizerContact: request.organizerContact,
          imageUrl: request.imageUrl,
          eventType: request.eventType,
          vehicleFocus: request.vehicleFocus,
          expectedAttendance: request.expectedAttendance,
          entryFee: request.entryFee,
          scheduleHighlights: request.scheduleHighlights,
          activities: request.activities,
          rulesUrl: request.rulesUrl,
          sponsors: request.sponsors,
          websiteUrl: request.websiteUrl,
      };
      await addDoc(collection(db, "events"), { ...approvedEventData, status: "approved", submittedAt: request.submittedAt });
      await deleteDoc(doc(db, "pendingEvents", request.id));
      setRequests(requests.filter(r => r.id !== request.id));
      setSelectedEvent(null); // Close modal after action
    } catch (error) {
      console.error("Error approving event: ", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
        // For rejection, you might want to move to a rejected collection
        // or simply delete. Here we delete.
        await deleteDoc(doc(db, "pendingEvents", id));
        setRequests(requests.filter(r => r.id !== id));
        setSelectedEvent(null); // Close modal after action
    } catch (error) {
        console.error("Error rejecting event: ", error);
    }
  };

  const handleDelete = async (id: string) => {
      try {
          await deleteDoc(doc(db, "pendingEvents", id));
          setRequests(requests.filter(r => r.id !== id));
           setSelectedEvent(null); // Close modal after action
      } catch (error) {
          console.error("Error deleting event: ", error);
      }
  };

  const handleRowClick = (request: EventRequest) => {
      setSelectedEvent(request);
  };

  return (
      <>
        <h1 className="text-2xl font-semibold mb-4">Pending Event Requests</h1>
        {loading ? (
            <p>Loading...</p>
        ) : (
            <div className="overflow-x-auto">
                <Table className="min-w-full">
                <TableHeader>
                    <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map(request => (
                    <TableRow key={request.id} onClick={() => handleRowClick(request)} className="cursor-pointer hover:bg-gray-100">
                        <TableCell>
                            {request.imageUrl && (
                                <Image src={request.imageUrl} alt={request.eventName} width={50} height={30} className="rounded-md object-cover" />
                            )}
                        </TableCell>
                        <TableCell>{request.eventName}</TableCell>
                        <TableCell>{request.eventDate?.seconds ? new Date(request.eventDate.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{request.location}</TableCell>
                        <TableCell>
                            <Badge variant={request.status === 'pending' ? 'default' : request.status === 'approved' ? 'secondary' : 'destructive'}>{request.status}</Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}> {/* Prevent row click when clicking dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                             {request.status === 'pending' && (
                                 <>
                                    <DropdownMenuItem onClick={() => handleApprove(request)}>Approve</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleReject(request.id)}>Reject</DropdownMenuItem>
                                 </>
                             )}
                             {(request.status === 'approved' || request.status === 'rejected') && (
                                  <DropdownMenuItem onClick={() => handleDelete(request.id)}>Delete</DropdownMenuItem>
                             )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
        )}

        {/* Event Details Modal */}
        <Dialog open={selectedEvent !== null} onOpenChange={() => setSelectedEvent(null)}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{selectedEvent?.eventName}</DialogTitle>
                    <DialogDescription>Details of the event submission.</DialogDescription>
                </DialogHeader>
                {selectedEvent && (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                             <div className="font-semibold">Image:</div>
                             <div>{selectedEvent.imageUrl && <Image src={selectedEvent.imageUrl} alt={selectedEvent.eventName} width={200} height={150} className="rounded-md object-cover" />}</div>
                        </div>
                         <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <div className="font-semibold">Status:</div>
                            <div><Badge variant={selectedEvent.status === 'pending' ? 'default' : selectedEvent.status === 'approved' ? 'secondary' : 'destructive'}>{selectedEvent.status}</Badge></div>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <div className="font-semibold">Date:</div>
                            <div>{selectedEvent.eventDate?.seconds ? new Date(selectedEvent.eventDate.seconds * 1000).toLocaleDateString() : 'N/A'}</div>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <div className="font-semibold">Location:</div>
                            <div>{selectedEvent.location}</div>
                        </div>
                         <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <div className="font-semibold">Event Type:</div>
                            <div>{selectedEvent.eventType || 'N/A'}</div>
                        </div>
                         <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <div className="font-semibold">Vehicle Focus:</div>
                            <div>{selectedEvent.vehicleFocus || 'N/A'}</div>
                        </div>
                         <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <div className="font-semibold">Attendance:</div>
                            <div>{selectedEvent.expectedAttendance || 'N/A'}</div>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <div className="font-semibold">Entry Fee:</div>
                            <div>{selectedEvent.entryFee !== undefined ? selectedEvent.entryFee : 'N/A'}</div>
                        </div>
                         <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <div className="font-semibold">Organizer:</div>
                            <div>{selectedEvent.organizerName}</div>
                        </div>
                         <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <div className="font-semibold">Contact:</div>
                            <div>{selectedEvent.organizerContact}</div>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <div className="font-semibold">Description:</div>
                            <div>{selectedEvent.description}</div>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <div className="font-semibold">Schedule:</div>
                            <div>{selectedEvent.scheduleHighlights || 'N/A'}</div>
                        </div>
                         <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <div className="font-semibold">Activities:</div>
                            <div>{selectedEvent.activities || 'N/A'}</div>
                        </div>
                         <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <div className="font-semibold">Rules URL:</div>
                            <div>{selectedEvent.rulesUrl ? <a href={selectedEvent.rulesUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedEvent.rulesUrl}</a> : 'N/A'}</div>
                        </div>
                         <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <div className="font-semibold">Website URL:</div>
                            <div>{selectedEvent.websiteUrl ? <a href={selectedEvent.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedEvent.websiteUrl}</a> : 'N/A'}</div>
                        </div>
                         <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <div className="font-semibold">Sponsors:</div>
                            <div>{selectedEvent.sponsors || 'N/A'}</div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
      </>
  );
}
