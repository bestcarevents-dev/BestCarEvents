"use client";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, doc, deleteDoc, addDoc } from "firebase/firestore";
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

export default function PendingAuctionsPage() {
  const [requests, setRequests] = useState<AuctionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState<AuctionRequest | null>(null);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "pendingAuctions"));
      const requestsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuctionRequest));
      setRequests(requestsData);
      setLoading(false);
    };
    fetchRequests();
  }, [db]);

  const handleApprove = async (request: AuctionRequest) => {
    try {
      const auctionData = { ...request, status: "approved" };
      await addDoc(collection(db, "auctions"), auctionData);
      await deleteDoc(doc(db, "pendingAuctions", request.id));
      setRequests(requests.filter(r => r.id !== request.id));
      setSelectedAuction(null);
    } catch (error) {
      console.error("Error approving auction: ", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
        await deleteDoc(doc(db, "pendingAuctions", id));
        setRequests(requests.filter(r => r.id !== id));
        setSelectedAuction(null);
    } catch (error) {
        console.error("Error rejecting auction: ", error);
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
        <h1 className="text-2xl font-semibold mb-4">Pending Auction Event Requests</h1>
        {loading ? (
            <p>Loading...</p>
        ) : (
            <div className="border rounded-lg">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Auction Name</TableHead>
                    <TableHead>Auction House</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map(request => (
                    <TableRow key={request.id} onClick={() => setSelectedAuction(request)} className="cursor-pointer">
                        <TableCell className="font-medium">{request.auctionName}</TableCell>
                        <TableCell>{request.auctionHouse}</TableCell>
                        <TableCell>{format(new Date(request.startDate.seconds * 1000), "P")} - {format(new Date(request.endDate.seconds * 1000), "P")}</TableCell>
                        <TableCell>{request.city}, {request.state}</TableCell>
                        <TableCell>
                            <Badge variant={request.status === 'pending' ? 'default' : 'outline'}>{request.status}</Badge>
                        </TableCell>
                         <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedAuction(request)}}>View Details</Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
        )}
        {selectedAuction && (
            <Dialog open={!!selectedAuction} onOpenChange={() => setSelectedAuction(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">{selectedAuction.auctionName}</DialogTitle>
                        <DialogDescription>by {selectedAuction.auctionHouse}</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                        <div>
                            <Image src={selectedAuction.imageUrl} alt="Auction image" width={800} height={600} className="rounded-lg object-cover mb-6" />
                            <h3 className="font-semibold text-lg mb-2">Description</h3>
                            <p className="text-muted-foreground">{selectedAuction.description}</p>
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
                                <DetailItem label="Registration Link" value={selectedAuction.registrationLink ? <a href={selectedAuction.registrationLink} target="_blank" rel="noreferrer" className="text-primary underline">Link</a> : 'N/A'} />
                            </div>

                             <h3 className="font-semibold text-lg mb-2">Viewing Times</h3>
                             <p className="text-muted-foreground mb-6 whitespace-pre-wrap">{selectedAuction.viewingTimes || 'N/A'}</p>

                             <h3 className="font-semibold text-lg mb-2">Organizer Information</h3>
                             <DetailItem label="Name" value={selectedAuction.organizerName} />
                             <DetailItem label="Contact Email" value={selectedAuction.organizerContact} />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={() => handleReject(selectedAuction.id)}>Reject</Button>
                        <Button onClick={() => handleApprove(selectedAuction)}>Approve</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
      </>
  );
}
