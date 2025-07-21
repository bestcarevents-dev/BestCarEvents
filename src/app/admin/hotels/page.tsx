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
  imageUrl: string;
  status: "pending" | "approved" | "rejected";
}

export default function PendingHotelsPage() {
  const [requests, setRequests] = useState<HotelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState<HotelRequest | null>(null);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "pendingHotels"));
      const requestsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HotelRequest));
      setRequests(requestsData);
      setLoading(false);
    };
    fetchRequests();
  }, [db]);

  const handleApprove = async (request: HotelRequest) => {
    try {
      const hotelData = { ...request, status: "approved" };
      await addDoc(collection(db, "hotels"), hotelData);
      await deleteDoc(doc(db, "pendingHotels", request.id));
      setRequests(requests.filter(r => r.id !== request.id));
      setSelectedHotel(null);
    } catch (error) {
      console.error("Error approving hotel: ", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
        await deleteDoc(doc(db, "pendingHotels", id));
        setRequests(requests.filter(r => r.id !== id));
        setSelectedHotel(null);
    } catch (error) {
        console.error("Error rejecting hotel: ", error);
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
        <h1 className="text-2xl font-semibold mb-4">Pending Hotel & Storage Listings</h1>
        {loading ? (
            <p>Loading...</p>
        ) : (
            <div className="border rounded-lg">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Facility Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map(request => (
                    <TableRow key={request.id} onClick={() => setSelectedHotel(request)} className="cursor-pointer">
                        <TableCell className="font-medium">{request.hotelName}</TableCell>
                        <TableCell>{request.city}, {request.state}</TableCell>
                        <TableCell>{request.contactName}</TableCell>
                        <TableCell>
                            <Badge variant={request.status === 'pending' ? 'default' : 'outline'}>{request.status}</Badge>
                        </TableCell>
                         <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedHotel(request)}}>View Details</Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
        )}
        {selectedHotel && (
            <Dialog open={!!selectedHotel} onOpenChange={() => setSelectedHotel(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">{selectedHotel.hotelName}</DialogTitle>
                        <DialogDescription>{selectedHotel.address}, {selectedHotel.city}, {selectedHotel.state}, {selectedHotel.country}</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                        <div>
                            <Image src={selectedHotel.imageUrl} alt="Hotel image" width={800} height={600} className="rounded-lg object-cover mb-6" />
                            <h3 className="font-semibold text-lg mb-2">Description</h3>
                            <p className="text-muted-foreground">{selectedHotel.description}</p>
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
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={() => handleReject(selectedHotel.id)}>Reject</Button>
                        <Button onClick={() => handleApprove(selectedHotel)}>Approve</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
      </>
  );
}
