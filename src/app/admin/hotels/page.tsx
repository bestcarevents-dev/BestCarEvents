"use client";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, doc, deleteDoc, addDoc, updateDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface HotelRequest {
  id: string;
  hotelName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  website?: string;
  description: string;
  storageType: string;
  features?: string[];
  contactName: string;
  contactEmail: string;
  imageUrl?: string;
  imageUrls?: string[];
  status: "pending" | "approved" | "rejected";
  createdAt?: any;
  featured?: boolean;
  listing_type?: string;
  feature_start?: any;
  feature_end?: any;
  uploadedByUserEmail?: string;
  uploadedByUserId?: string;
}

export default function AdminHotelsPage() {
  const [pendingRequests, setPendingRequests] = useState<HotelRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<HotelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState<HotelRequest | null>(null);
  const [tab, setTab] = useState("pending");
  const db = getFirestore(app);

  // Feature modal state
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [featureTargetId, setFeatureTargetId] = useState<string | null>(null);
  const [featureEnd, setFeatureEnd] = useState<string>("");

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      // Fetch pending hotels
      const pendingSnapshot = await getDocs(collection(db, "pendingHotels"));
      const pendingData = pendingSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as HotelRequest));
      setPendingRequests(pendingData);
      // Fetch approved hotels
      const approvedSnapshot = await getDocs(collection(db, "hotels"));
      const approvedData = approvedSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as HotelRequest));
      setApprovedRequests(approvedData);
      setLoading(false);
    };
    fetchRequests();
  }, [db]);

  const sendApprovalEmail = async (
    listingType: 'hotel',
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

  const handleApprove = async (request: HotelRequest) => {
    try {
      const hotelData = {
        ...request,
        status: "approved",
        createdAt: new Date(),
        imageUrls: request.imageUrls || (request.imageUrl ? [request.imageUrl] : []),
      };
      delete hotelData.id;
      await addDoc(collection(db, "hotels"), hotelData);
      await deleteDoc(doc(db, "pendingHotels", request.id));
      setPendingRequests(pendingRequests.filter(r => r.id !== request.id));
      setSelectedHotel(null);
      await sendApprovalEmail('hotel', 'approved', request.uploadedByUserEmail || null, request.hotelName);
    } catch (error) {
      console.error("Error approving hotel: ", error);
    }
  };

  const handleReject = async (request: HotelRequest) => {
    try {
      await deleteDoc(doc(db, "pendingHotels", request.id));
      setPendingRequests(pendingRequests.filter(r => r.id !== request.id));
      setSelectedHotel(null);
      await sendApprovalEmail('hotel', 'rejected', request.uploadedByUserEmail || null, request.hotelName);
    } catch (error) {
      console.error("Error rejecting hotel: ", error);
    }
  };

  const handleDeleteApproved = async (id: string) => {
    try {
      await deleteDoc(doc(db, "hotels", id));
      setApprovedRequests(approvedRequests.filter(r => r.id !== id));
      setSelectedHotel(null);
    } catch (error) {
      console.error("Error deleting approved hotel: ", error);
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
      await updateDoc(doc(db, "hotels", featureTargetId), {
        featured: true,
        listing_type: "featured",
        feature_start: new Date(),
        feature_end: endDate,
      });
      setFeatureDialogOpen(false);
      setFeatureTargetId(null);
      setFeatureEnd("");
    } catch (error) {
      console.error("Error setting featured hotel:", error);
    }
  };

  const DetailItem = ({ label, value }: { label: string, value: any }) => (
    <div>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="text-md">{value || 'N/A'}</p>
    </div>
  );

  const renderTable = (requests: HotelRequest[], status: string, showActions = true) => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Facility Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Featured</TableHead>
            <TableHead>Feature End</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map(request => (
            <TableRow key={request.id} onClick={() => setSelectedHotel(request)} className="cursor-pointer">
              <TableCell>
                <Image src={request.imageUrls?.[0] || request.imageUrl || "https://via.placeholder.com/200x120?text=No+Image"} alt={request.hotelName} width={100} height={60} className="rounded-md object-cover" />
              </TableCell>
              <TableCell className="font-medium">{request.hotelName}</TableCell>
              <TableCell>{request.city}, {request.state}</TableCell>
              <TableCell>{request.contactName}</TableCell>
              <TableCell>
                <Badge variant={status === 'pending' ? 'default' : status === 'approved' ? 'secondary' : 'outline'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={(request.featured || request.listing_type === 'featured') ? 'default' : 'outline'}>
                  {(request.featured || request.listing_type === 'featured') ? 'Yes' : 'No'}
                </Badge>
              </TableCell>
              <TableCell>
                {request.feature_end?.seconds
                  ? new Date(request.feature_end.seconds * 1000).toLocaleString('en-GB')
                  : (request.feature_end
                      ? (new Date(request.feature_end as any)).toLocaleString('en-GB')
                      : '-')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {status === 'approved' && (
                    <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); openFeatureDialog(request.id); }}>Feature</Button>
                  )}
                  <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setSelectedHotel(request); }}>View Details</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Hotel & Storage Listings</h1>
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="denied">Denied</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "pending" && (loading ? <p>Loading...</p> : renderTable(pendingRequests, "pending"))}
      {tab === "approved" && (loading ? <p>Loading...</p> : renderTable(approvedRequests, "approved", false))}
      {tab === "denied" && (
        <div className="p-8 text-center text-muted-foreground">
          <h2 className="text-xl font-semibold mb-2">Denied Hotels</h2>
          <p>Denied hotels are not stored. Once denied, a hotel listing is permanently removed from the system.</p>
        </div>
      )}
      {selectedHotel && (
        <Dialog open={!!selectedHotel} onOpenChange={() => setSelectedHotel(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            <button
              className="absolute right-4 top-4 z-10 rounded-full bg-white/80 hover:bg-red-500 hover:text-white text-gray-700 p-2 shadow-md transition-colors"
              onClick={() => setSelectedHotel(null)}
              aria-label="Close"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
            <DialogHeader className="px-6 pt-6">
              <DialogTitle className="font-headline text-2xl">{selectedHotel.hotelName}</DialogTitle>
              <DialogDescription>{selectedHotel.address}, {selectedHotel.city}, {selectedHotel.state}, {selectedHotel.country}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 px-6">
              <div>
                {/* Carousel for images */}
                {(selectedHotel.imageUrls?.length || selectedHotel.imageUrl) ? (
                  <div className="w-full mb-6">
                    {/* Simple carousel for images */}
                    <div className="flex gap-2 overflow-x-auto">
                      {(selectedHotel.imageUrls || [selectedHotel.imageUrl]).map((img, i) => (
                        <Image key={i} src={img} alt={`Hotel image ${i + 1}`} width={300} height={200} className="rounded-lg object-cover w-60 h-40" />
                      ))}
                    </div>
                  </div>
                ) : null}
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-muted-foreground mb-4">{selectedHotel.description}</p>
              </div>
              <div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <DetailItem label="Storage Type" value={selectedHotel.storageType} />
                  <DetailItem label="Website" value={selectedHotel.website ? <a href={selectedHotel.website} target="_blank" rel="noreferrer" className="text-primary underline">Link</a> : 'N/A'} />
                </div>
                <h3 className="font-semibold text-lg mb-2">Features</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedHotel.features?.map(f => <Badge key={f} variant="secondary">{f}</Badge>) ?? <p>No features listed.</p>}
                </div>
                <h3 className="font-semibold text-lg mb-2">Contact Information</h3>
                <DetailItem label="Name" value={selectedHotel.contactName} />
                <DetailItem label="Email" value={selectedHotel.contactEmail} />
                {selectedHotel.createdAt && (
                  <DetailItem label="Created At" value={selectedHotel.createdAt?.seconds ? new Date(selectedHotel.createdAt.seconds * 1000).toLocaleString('en-GB') : selectedHotel.createdAt.toString()} />
                )}

                <h3 className="font-semibold text-lg mb-2 mt-6">Uploaded By</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">User ID:</span> {selectedHotel.uploadedByUserId || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {selectedHotel.uploadedByUserEmail || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            {tab === "pending" && (
              <DialogFooter className="px-6 pb-6">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={() => handleReject(selectedHotel)}>Reject</Button>
                <Button onClick={() => handleApprove(selectedHotel)}>Approve</Button>
              </DialogFooter>
            )}
            {tab === "approved" && (
              <DialogFooter className="px-6 pb-6">
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                <Button variant="destructive" onClick={() => handleDeleteApproved(selectedHotel.id)}>Delete</Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Feature Hotel Modal */}
      <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature Hotel</DialogTitle>
            <DialogDescription>Choose when the featured status should end.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="featureEndHotel" className="text-sm">Feature end</label>
            <Input id="featureEndHotel" type="datetime-local" value={featureEnd} onChange={(e) => setFeatureEnd(e.target.value)} />
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
