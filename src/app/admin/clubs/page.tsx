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
  createdAt?: any;
  featured?: boolean;
  listing_type?: string;
  feature_start?: any;
  feature_end?: any;
  uploadedByUserEmail?: string;
  uploadedByUserId?: string;
}

export default function AdminClubsPage() {
  const [pendingRequests, setPendingRequests] = useState<ClubRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<ClubRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState<ClubRequest | null>(null);
  const [tab, setTab] = useState("pending");
  const db = getFirestore(app);

  // Feature modal state
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [featureTargetId, setFeatureTargetId] = useState<string | null>(null);
  const [featureEnd, setFeatureEnd] = useState<string>("");

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      // Fetch pending clubs
      const pendingSnapshot = await getDocs(collection(db, "pendingClubs"));
      const pendingData = pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClubRequest));
      setPendingRequests(pendingData);
      // Fetch approved clubs
      const approvedSnapshot = await getDocs(collection(db, "clubs"));
      const approvedData = approvedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClubRequest));
      setApprovedRequests(approvedData);
      setLoading(false);
    };
    fetchRequests();
  }, [db]);

  const sendApprovalEmail = async (
    listingType: 'club',
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

  const handleApprove = async (request: ClubRequest) => {
    try {
      const clubData = { ...request, status: "approved", createdAt: new Date() };
      delete clubData.id;
      await addDoc(collection(db, "clubs"), clubData);
      await deleteDoc(doc(db, "pendingClubs", request.id));
      setPendingRequests(pendingRequests.filter(r => r.id !== request.id));
      setSelectedClub(null);
      await sendApprovalEmail('club', 'approved', request.uploadedByUserEmail || null, request.clubName);
    } catch (error) {
      console.error("Error approving club: ", error);
    }
  };

  const handleReject = async (request: ClubRequest) => {
    try {
      await deleteDoc(doc(db, "pendingClubs", request.id));
      setPendingRequests(pendingRequests.filter(r => r.id !== request.id));
      setSelectedClub(null);
      await sendApprovalEmail('club', 'rejected', request.uploadedByUserEmail || null, request.clubName);
    } catch (error) {
      console.error("Error rejecting club: ", error);
    }
  };

  const handleDeleteApproved = async (id: string) => {
    try {
      await deleteDoc(doc(db, "clubs", id));
      setApprovedRequests(approvedRequests.filter(r => r.id !== id));
      setSelectedClub(null);
    } catch (error) {
      console.error("Error deleting approved club: ", error);
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
      await updateDoc(doc(db, "clubs", featureTargetId), {
        featured: true,
        listing_type: "featured",
        feature_start: new Date(),
        feature_end: endDate,
      });
      setFeatureDialogOpen(false);
      setFeatureTargetId(null);
      setFeatureEnd("");
    } catch (error) {
      console.error("Error setting featured club:", error);
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
      <h1 className="text-2xl font-semibold mb-4">Club Registrations</h1>
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
                {pendingRequests.map(request => (
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
                      <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setSelectedClub(request); }}>View Details</Button>
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
                  <TableHead>Logo</TableHead>
                  <TableHead>Club Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Feature End</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedRequests.map(request => (
                  <TableRow key={request.id} onClick={() => setSelectedClub(request)} className="cursor-pointer">
                    <TableCell>
                      <Image src={request.logoUrl} alt={request.clubName} width={40} height={40} className="rounded-md object-contain" />
                    </TableCell>
                    <TableCell className="font-medium">{request.clubName}</TableCell>
                    <TableCell>{request.city}, {request.country}</TableCell>
                    <TableCell>{request.contactName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Approved</Badge>
                    </TableCell>
                    <TableCell>{request.createdAt?.seconds ? new Date(request.createdAt.seconds * 1000).toLocaleString('en-GB') : (request.createdAt ? request.createdAt.toString() : "-")}</TableCell>
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
      {tab === "denied" && (
        <div className="p-8 text-center text-muted-foreground">
          <h2 className="text-xl font-semibold mb-2">Denied Clubs</h2>
          <p>Denied clubs are not stored. Once denied, a club registration is permanently removed from the system.</p>
        </div>
      )}
      {selectedClub && (
        <Dialog open={!!selectedClub} onOpenChange={() => setSelectedClub(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            <button
              className="absolute right-4 top-4 z-10 rounded-full bg-white/80 hover:bg-red-500 hover:text-white text-gray-700 p-2 shadow-md transition-colors"
              onClick={() => setSelectedClub(null)}
              aria-label="Close"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
            <DialogHeader className="px-6 pt-6">
              <DialogTitle className="font-headline text-2xl flex items-center gap-4">
                <Image src={selectedClub.logoUrl} alt={selectedClub.clubName} width={50} height={50} className="rounded-lg object-contain" />
                {selectedClub.clubName}
              </DialogTitle>
              <DialogDescription>{selectedClub.city}, {selectedClub.country}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 px-6">
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
                {selectedClub.createdAt && (
                  <DetailItem label="Created At" value={selectedClub.createdAt?.seconds ? new Date(selectedClub.createdAt.seconds * 1000).toLocaleString('en-GB') : selectedClub.createdAt.toString()} />
                )}

                <h3 className="font-semibold text-lg mb-2 mt-6">Uploaded By</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">User ID:</span> {selectedClub.uploadedByUserId || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {selectedClub.uploadedByUserEmail || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            {tab === "pending" && (
              <DialogFooter className="px-6 pb-6">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={() => handleReject(selectedClub)}>Reject</Button>
                <Button onClick={() => handleApprove(selectedClub)}>Approve</Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Feature Club Modal */}
      <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature Club</DialogTitle>
            <DialogDescription>Choose when the featured status should end.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="featureEndClub" className="text-sm">Feature end</label>
            <Input id="featureEndClub" type="datetime-local" value={featureEnd} onChange={(e) => setFeatureEnd(e.target.value)} />
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
