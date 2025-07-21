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

interface ClubRequest {
  id: string;
  clubName: string;
  city: string;
  country: string;
  website?: string;
  socialMediaLink?: string;
  description: string;
  membershipCriteria: string;
  typicalActivities: string;
  contactName: string;
  contactEmail: string;
  logoUrl: string;
  status: "pending" | "approved" | "rejected";
}

export default function PendingClubsPage() {
  const [requests, setRequests] = useState<ClubRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState<ClubRequest | null>(null);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "pendingClubs"));
      const requestsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClubRequest));
      setRequests(requestsData);
      setLoading(false);
    };
    fetchRequests();
  }, [db]);

  const handleApprove = async (request: ClubRequest) => {
    try {
      const clubData = { ...request, status: "approved" };
      await addDoc(collection(db, "clubs"), clubData);
      await deleteDoc(doc(db, "pendingClubs", request.id));
      setRequests(requests.filter(r => r.id !== request.id));
      setSelectedClub(null);
    } catch (error) {
      console.error("Error approving club: ", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
        await deleteDoc(doc(db, "pendingClubs", id));
        setRequests(requests.filter(r => r.id !== id));
        setSelectedClub(null);
    } catch (error) {
        console.error("Error rejecting club: ", error);
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
        <h1 className="text-2xl font-semibold mb-4">Pending Club Registrations</h1>
        {loading ? (
            <p>Loading...</p>
        ) : (
            <div className="border rounded-lg">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Logo</TableHead>
                    <TableHead>Club Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map(request => (
                    <TableRow key={request.id} onClick={() => setSelectedClub(request)} className="cursor-pointer">
                        <TableCell>
                            <Image src={request.logoUrl} alt={request.clubName} width={40} height={40} className="rounded-md object-contain" />
                        </TableCell>
                        <TableCell className="font-medium">{request.clubName}</TableCell>
                        <TableCell>{request.city}, {request.country}</TableCell>
                        <TableCell>{request.contactName}</TableCell>
                        <TableCell>
                            <Badge variant={request.status === 'pending' ? 'default' : 'outline'}>{request.status}</Badge>
                        </TableCell>
                         <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedClub(request)}}>View Details</Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
        )}
        {selectedClub && (
            <Dialog open={!!selectedClub} onOpenChange={() => setSelectedClub(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl flex items-center gap-4">
                            <Image src={selectedClub.logoUrl} alt={selectedClub.clubName} width={50} height={50} className="rounded-lg object-contain" />
                            {selectedClub.clubName}
                        </DialogTitle>
                        <DialogDescription>{selectedClub.city}, {selectedClub.country}</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                        <div>
                             <h3 className="font-semibold text-lg mb-2">Description</h3>
                             <p className="text-muted-foreground mb-6">{selectedClub.description}</p>
                             <h3 className="font-semibold text-lg mb-2">Membership Criteria</h3>
                             <p className="text-muted-foreground mb-6">{selectedClub.membershipCriteria}</p>
                             <h3 className="font-semibold text-lg mb-2">Typical Activities</h3>
                             <p className="text-muted-foreground">{selectedClub.typicalActivities}</p>
                        </div>
                        <div>
                             <div className="grid grid-cols-1 gap-4 mb-6">
                                <DetailItem label="Website" value={selectedClub.website ? <a href={selectedClub.website} target="_blank" rel="noreferrer" className="text-primary underline">Link</a> : 'N/A'} />
                                <DetailItem label="Social Media" value={selectedClub.socialMediaLink ? <a href={selectedClub.socialMediaLink} target="_blank" rel="noreferrer" className="text-primary underline">Link</a> : 'N/A'} />
                            </div>

                             <h3 className="font-semibold text-lg mb-2">Contact Information</h3>
                             <DetailItem label="Name" value={selectedClub.contactName} />
                             <DetailItem label="Email" value={selectedClub.contactEmail} />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={() => handleReject(selectedClub.id)}>Reject</Button>
                        <Button onClick={() => handleApprove(selectedClub)}>Approve</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
      </>
  );
}
