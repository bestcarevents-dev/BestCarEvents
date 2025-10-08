"use client";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface EventRequest {
  id: string;
  eventName: string;
  eventDate: any;
  endDate?: any;
  location: string;
  description: string;
  organizerName: string;
  organizerContact: string;
  imageUrl: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: any;
  uploadedByUserEmail?: string;
  uploadedByUserId?: string;
  
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
  // Feature fields
  featured?: boolean;
  feature_type?: string;
  feature_start?: any;
  feature_end?: any;
}

export default function PendingEventsPage() {
  const [pendingRequests, setPendingRequests] = useState<EventRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventRequest | null>(null);
  const [tab, setTab] = useState("pending");
  const db = getFirestore(app);

  // Feature modal state
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [featureTargetId, setFeatureTargetId] = useState<string | null>(null);
  const [featureEnd, setFeatureEnd] = useState<string>("");

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      // Fetch pending events
      const pendingSnapshot = await getDocs(collection(db, "pendingEvents"));
      const pendingData = pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventRequest));
      setPendingRequests(pendingData);
      // Fetch approved events
      const approvedSnapshot = await getDocs(collection(db, "events"));
      const approvedData = approvedSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as EventRequest))
        .filter(event => event.status === "approved");
      setApprovedRequests(approvedData);
      setLoading(false);
    };
    fetchRequests();
  }, [db]);

  const sendApprovalEmail = async (
    listingType: 'event',
    action: 'approved' | 'rejected',
    to?: string | null,
    listingName?: string
  ) => {
    try {
      if (!to) return;
      await fetch('/api/emails/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, listingType, action, listingName })
      });
    } catch (e) {
      console.error('Failed to send approval email:', e);
    }
  };

  const handleApprove = async (request: EventRequest) => {
    try {
      // Fetch full pending document to ensure we carry over ALL attributes
      const pendingRef = doc(db, "pendingEvents", request.id);
      const pendingSnap = await getDoc(pendingRef);
      const fullData = pendingSnap.exists() ? pendingSnap.data() : {};

      // Compose final approved event payload preserving all original fields
      const eventPayload: Record<string, any> = {
        ...fullData,
        status: "approved",
        submittedAt: (fullData as any)?.submittedAt ?? request.submittedAt,
        createdAt: new Date(),
      };

      await addDoc(collection(db, "events"), eventPayload);
      await deleteDoc(doc(db, "pendingEvents", request.id));
      setPendingRequests(pendingRequests.filter(r => r.id !== request.id));
      setSelectedEvent(null); // Close modal after action
      await sendApprovalEmail('event', 'approved', request.uploadedByUserEmail || null, request.eventName);
    } catch (error) {
      console.error("Error approving event: ", error);
    }
  };

  const handleReject = async (request: EventRequest) => {
    try {
        // For rejection, you might want to move to a rejected collection
        // or simply delete. Here we delete.
        await deleteDoc(doc(db, "pendingEvents", request.id));
        setPendingRequests(pendingRequests.filter(r => r.id !== request.id));
        setSelectedEvent(null); // Close modal after action
        await sendApprovalEmail('event', 'rejected', request.uploadedByUserEmail || null, request.eventName);
    } catch (error) {
        console.error("Error rejecting event: ", error);
    }
  };

  const handleDelete = async (id: string) => {
      try {
          await deleteDoc(doc(db, "pendingEvents", id));
          setPendingRequests(pendingRequests.filter(r => r.id !== id));
           setSelectedEvent(null); // Close modal after action
      } catch (error) {
          console.error("Error deleting event: ", error);
      }
  };

  const handleRowClick = (request: EventRequest) => {
      setSelectedEvent(request);
  };

  // Add this function to handle deleting approved events
  const handleDeleteApproved = async (id: string) => {
    try {
      await deleteDoc(doc(db, "events", id));
      setApprovedRequests(approvedRequests.filter(r => r.id !== id));
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error deleting approved event: ", error);
    }
  };

  const openFeatureDialog = (id: string) => {
    setFeatureTargetId(id);
    setFeatureEnd("");
    setFeatureDialogOpen(true);
  };

  const handleSetFeatured = async () => {
    if (!featureTargetId || !featureEnd) return;
    try {
      const endDate = new Date(featureEnd);
      await updateDoc(doc(db, "events", featureTargetId), {
        featured: true,
        feature_type: "featured",
        feature_start: new Date(),
        feature_end: endDate,
      });
      setFeatureDialogOpen(false);
      setFeatureTargetId(null);
      setFeatureEnd("");
    } catch (error) {
      console.error("Error setting featured event:", error);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Event Requests</h1>
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="denied">Denied</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "pending" && (
        loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Date</TableHead>
                <TableHead>End Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map(request => (
                  <TableRow key={request.id} onClick={() => handleRowClick(request)} className="cursor-pointer transition-colors hover:bg-muted hover:text-primary">
                    <TableCell>
                      {request.imageUrl && (
                        <Image src={request.imageUrl} alt={request.eventName} width={50} height={30} className="rounded-md object-cover" />
                      )}
                    </TableCell>
                    <TableCell>{request.eventName}</TableCell>
                    <TableCell>{request.eventDate?.seconds ? new Date(request.eventDate.seconds * 1000).toLocaleDateString('en-GB') : 'N/A'}</TableCell>
                    <TableCell>{request.endDate?.seconds ? new Date(request.endDate.seconds * 1000).toLocaleDateString('en-GB') : (request.endDate ? new Date(request.endDate as any).toLocaleDateString('en-GB') : '-')}</TableCell>
                    <TableCell>{request.location}</TableCell>
                    <TableCell>
                      <Badge variant={request.status === 'pending' ? 'default' : request.status === 'approved' ? 'secondary' : 'destructive'}>{request.status}</Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
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
                              <DropdownMenuItem onClick={() => handleReject(request)}>Reject</DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      )}
      {tab === "approved" && (
        loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Date</TableHead>
                <TableHead>End Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Feature End</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedRequests.map(request => (
                  <TableRow key={request.id} onClick={() => handleRowClick(request)} className="cursor-pointer transition-colors hover:bg-muted hover:text-primary">
                    <TableCell>
                      {request.imageUrl && (
                        <Image src={request.imageUrl} alt={request.eventName} width={50} height={30} className="rounded-md object-cover" />
                      )}
                    </TableCell>
                    <TableCell>{request.eventName}</TableCell>
                    <TableCell>{request.eventDate?.seconds ? new Date(request.eventDate.seconds * 1000).toLocaleDateString('en-GB') : 'N/A'}</TableCell>
                    <TableCell>{request.endDate?.seconds ? new Date(request.endDate.seconds * 1000).toLocaleDateString('en-GB') : (request.endDate ? new Date(request.endDate as any).toLocaleDateString('en-GB') : '-')}</TableCell>
                    <TableCell>{request.location}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Approved</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={(request.featured || request.feature_type === 'featured') ? 'default' : 'outline'}>
                        {(request.featured || request.feature_type === 'featured') ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.feature_end?.seconds
                        ? new Date(request.feature_end.seconds * 1000).toLocaleString('en-GB')
                        : (request.feature_end
                            ? (new Date(request.feature_end as any)).toLocaleString('en-GB')
                            : '-')}
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openFeatureDialog(request.id)}>Feature</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteApproved(request.id)}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      )}
      {tab === "denied" && (
        <div className="p-8 text-center text-muted-foreground">
          <h2 className="text-xl font-semibold mb-2">Denied Events</h2>
          <p>Denied events are not stored. Once denied, an event is permanently removed from the system.</p>
        </div>
      )}
      {/* Event Details Modal */}
      <Dialog open={selectedEvent !== null} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <button
            className="absolute right-4 top-4 z-10 rounded-full bg-white/80 hover:bg-red-500 hover:text-white text-gray-700 p-2 shadow-md transition-colors"
            onClick={() => setSelectedEvent(null)}
            aria-label="Close"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="font-headline text-2xl">{selectedEvent?.eventName}</DialogTitle>
            <DialogDescription>Details of the event submission.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 px-6">
            <div>
              {selectedEvent?.imageUrl && (
                <Image src={selectedEvent.imageUrl} alt={selectedEvent.eventName} width={800} height={400} className="rounded-lg object-cover w-full max-h-96 mb-6" />
              )}
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-muted-foreground mb-4">{selectedEvent?.description}</p>
              <h3 className="font-semibold text-lg mb-2">Schedule</h3>
              <p className="text-muted-foreground mb-4">{selectedEvent?.scheduleHighlights || 'N/A'}</p>
              <h3 className="font-semibold text-lg mb-2">Activities</h3>
              <p className="text-muted-foreground mb-4">{selectedEvent?.activities || 'N/A'}</p>
              <h3 className="font-semibold text-lg mb-2">Sponsors</h3>
              <p className="text-muted-foreground mb-4">{selectedEvent?.sponsors || 'N/A'}</p>
            </div>
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Date</p>
                  <p className="text-md">{selectedEvent?.eventDate?.seconds ? new Date(selectedEvent.eventDate.seconds * 1000).toLocaleDateString('en-GB') : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Location</p>
                  <p className="text-md">{selectedEvent?.location}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Type</p>
                  <p className="text-md">{selectedEvent?.eventType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Vehicle Focus</p>
                  <p className="text-md">{selectedEvent?.vehicleFocus || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Attendance</p>
                  <p className="text-md">{selectedEvent?.expectedAttendance || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Entry Fee</p>
                  <p className="text-md">{selectedEvent?.entryFee !== undefined ? selectedEvent.entryFee : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Organizer</p>
                  <p className="text-md">{selectedEvent?.organizerName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Contact</p>
                  <p className="text-md">{selectedEvent?.organizerContact}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Rules URL</p>
                  <p className="text-md">{selectedEvent?.rulesUrl ? <a href={selectedEvent.rulesUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{selectedEvent.rulesUrl}</a> : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Website</p>
                  <p className="text-md">{selectedEvent?.websiteUrl ? <a href={selectedEvent.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{selectedEvent.websiteUrl}</a> : 'N/A'}</p>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Status</h3>
              <Badge variant={selectedEvent?.status === 'pending' ? 'default' : selectedEvent?.status === 'approved' ? 'secondary' : 'destructive'}>{selectedEvent?.status}</Badge>

              <h3 className="font-semibold text-lg mb-2 mt-6">Uploaded By</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">User ID:</span> {selectedEvent?.uploadedByUserId || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {selectedEvent?.uploadedByUserEmail || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feature Event Modal */}
      <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature Event</DialogTitle>
            <DialogDescription>Choose when the featured status should end.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="featureEnd" className="text-sm">Feature end</label>
            <Input id="featureEnd" type="datetime-local" value={featureEnd} onChange={(e) => setFeatureEnd(e.target.value)} />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFeatureDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSetFeatured} disabled={!featureEnd}>Set Featured</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
