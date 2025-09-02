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
import { format } from "date-fns";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface AuctionRequest {
  id: string;
  auctionName: string;
  auctionHouse: string;
  startDate: any;
  endDate: any;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
  auctionType: string;
  registrationLink?: string;
  viewingTimes?: string;
  organizerName: string;
  organizerContact: string;
  imageUrl: string;
  status: "pending" | "approved" | "rejected";
}

export default function AdminAuctionsPage() {
  const [pendingRequests, setPendingRequests] = useState<AuctionRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<AuctionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState<AuctionRequest | null>(null);
  const [tab, setTab] = useState("pending");
  const db = getFirestore(app);

  // Feature modal state
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [featureTargetId, setFeatureTargetId] = useState<string | null>(null);
  const [featureEnd, setFeatureEnd] = useState<string>("");

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      // Fetch pending auctions
      const pendingSnapshot = await getDocs(collection(db, "pendingAuctions"));
      const pendingData = pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuctionRequest));
      setPendingRequests(pendingData);
      // Fetch approved auctions
      const approvedSnapshot = await getDocs(collection(db, "auctions"));
      const approvedData = approvedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuctionRequest));
      setApprovedRequests(approvedData);
      setLoading(false);
    };
    fetchRequests();
  }, [db]);

  const handleApprove = async (request: AuctionRequest) => {
    try {
      const auctionData = { ...request, status: "approved", createdAt: new Date() };
      await addDoc(collection(db, "auctions"), auctionData);
      await deleteDoc(doc(db, "pendingAuctions", request.id));
      setPendingRequests(pendingRequests.filter(r => r.id !== request.id));
      setSelectedAuction(null);
    } catch (error) {
      console.error("Error approving auction: ", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await deleteDoc(doc(db, "pendingAuctions", id));
      setPendingRequests(pendingRequests.filter(r => r.id !== id));
      setSelectedAuction(null);
    } catch (error) {
      console.error("Error rejecting auction: ", error);
    }
  };

  const handleDeleteApproved = async (id: string) => {
    try {
      await deleteDoc(doc(db, "auctions", id));
      setApprovedRequests(approvedRequests.filter(r => r.id !== id));
      setSelectedAuction(null);
    } catch (error) {
      console.error("Error deleting approved auction: ", error);
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
      await updateDoc(doc(db, "auctions", featureTargetId), {
        featured: true,
        feature_start: new Date(),
        feature_end: endDate,
      });
      setFeatureDialogOpen(false);
      setFeatureTargetId(null);
      setFeatureEnd("");
    } catch (error) {
      console.error("Error setting featured auction:", error);
    }
  };

  const DetailItem = ({ label, value }: { label: string, value: any }) => (
    <div>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="text-md">{value || 'N/A'}</p>
    </div>
  );

  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Auction Event Listings</h1>
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "pending" && (
        loading ? (
          <p>Loading...</p>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Auction Name</TableHead>
                  <TableHead>Auction House</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map(request => (
                  <TableRow key={request.id} onClick={() => setSelectedAuction(request)} className="cursor-pointer">
                    <TableCell>
                      <Image src={request.imageUrl} alt={request.auctionName} width={100} height={60} className="rounded-md object-cover" />
                    </TableCell>
                    <TableCell className="font-medium">{request.auctionName}</TableCell>
                    <TableCell>{request.auctionHouse}</TableCell>
                    <TableCell>{format(new Date(request.startDate.seconds * 1000), "P")} - {format(new Date(request.endDate.seconds * 1000), "P")}</TableCell>
                    <TableCell>{request.city}, {request.state}</TableCell>
                    <TableCell>
                      <Badge variant={request.status === 'pending' ? 'default' : 'outline'}>{request.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setSelectedAuction(request); }}>View Details</Button>
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
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Auction Name</TableHead>
                  <TableHead>Auction House</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedRequests.map(request => (
                  <TableRow key={request.id} onClick={() => setSelectedAuction(request)} className="cursor-pointer">
                    <TableCell>
                      <Image src={request.imageUrl} alt={request.auctionName} width={100} height={60} className="rounded-md object-cover" />
                    </TableCell>
                    <TableCell className="font-medium">{request.auctionName}</TableCell>
                    <TableCell>{request.auctionHouse}</TableCell>
                    <TableCell>{format(new Date(request.startDate.seconds * 1000), "P")} - {format(new Date(request.endDate.seconds * 1000), "P")}</TableCell>
                    <TableCell>{request.city}, {request.state}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Approved</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); openFeatureDialog(request.id); }}>Feature</Button>
                        <Button variant="destructive" size="sm" onClick={e => { e.stopPropagation(); handleDeleteApproved(request.id); }}>Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      )}
      {tab === "declined" && (
        <div className="p-8 text-center text-muted-foreground">
          <h2 className="text-xl font-semibold mb-2">Declined Auctions</h2>
          <p>Declined auctions are not stored. Once declined, an auction listing is permanently removed from the system.</p>
        </div>
      )}
      {selectedAuction && (
        <Dialog open={!!selectedAuction} onOpenChange={() => setSelectedAuction(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            <button
              className="absolute right-4 top-4 z-10 rounded-full bg-white/80 hover:bg-red-500 hover:text-white text-gray-700 p-2 shadow-md transition-colors"
              onClick={() => setSelectedAuction(null)}
              aria-label="Close"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
            <DialogHeader className="px-6 pt-6">
              <DialogTitle className="font-headline text-2xl">{selectedAuction.auctionName}</DialogTitle>
              <DialogDescription>by {selectedAuction.auctionHouse}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 px-6">
              <div>
                <Carousel className="w-full mb-6">
                  <CarouselContent>
                    <CarouselItem>
                      <Image src={selectedAuction.imageUrl} alt="Auction image" width={800} height={600} className="rounded-lg object-cover w-full max-h-96" />
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-muted-foreground mb-4">{selectedAuction.description}</p>
              </div>
              <div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <DetailItem label="Start Date" value={format(new Date(selectedAuction.startDate.seconds * 1000), "PPP")} />
                  <DetailItem label="End Date" value={format(new Date(selectedAuction.endDate.seconds * 1000), "PPP")} />
                  <DetailItem label="Address" value={selectedAuction.address} />
                  <DetailItem label="City" value={selectedAuction.city} />
                  <DetailItem label="State" value={selectedAuction.state} />
                  <DetailItem label="Country" value={selectedAuction.country} />
                  <DetailItem label="Auction Type" value={selectedAuction.auctionType} />
                </div>
                <h3 className="font-semibold text-lg mb-2">Viewing Times</h3>
                <p className="text-muted-foreground mb-6 whitespace-pre-wrap">{selectedAuction.viewingTimes || 'N/A'}</p>
                <h3 className="font-semibold text-lg mb-2">Organizer Information</h3>
                <DetailItem label="Name" value={selectedAuction.organizerName} />
                <DetailItem label="Contact Email" value={selectedAuction.organizerContact} />
              </div>
            </div>
            {tab === "pending" && (
              <DialogFooter className="px-6 pb-6">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={() => handleReject(selectedAuction.id)}>Reject</Button>
                <Button onClick={() => handleApprove(selectedAuction)}>Approve</Button>
              </DialogFooter>
            )}
            {tab === "approved" && (
              <DialogFooter className="px-6 pb-6">
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                <Button variant="destructive" onClick={() => handleDeleteApproved(selectedAuction.id)}>Delete</Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Feature Auction Modal */}
      <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature Auction</DialogTitle>
            <DialogDescription>Choose when the featured status should end.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="featureEndAuction" className="text-sm">Feature end</label>
            <Input id="featureEndAuction" type="datetime-local" value={featureEnd} onChange={(e) => setFeatureEnd(e.target.value)} />
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
