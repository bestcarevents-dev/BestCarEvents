"use client";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "firebase/firestore";
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
  DialogClose,
} from "@/components/ui/dialog";
import Image from "next/image";
import { X } from "lucide-react";

interface PartnerRequest {
  id: string;
  partnerName: string;
  businessName: string;
  contactEmail: string;
  phone?: string;
  website?: string;
  socialMedia?: string;
  categories: string[];
  description: string;
  logoUrl: string;
  paymentMethod: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: any;
}

export default function AdminPartnersPage() {
  const [approvedRequests, setApprovedRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<PartnerRequest | null>(null);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      // Fetch approved partners
      const approvedSnapshot = await getDocs(collection(db, "partners"));
      const approvedData = approvedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PartnerRequest));
      setApprovedRequests(approvedData);
      setLoading(false);
    };
    fetchRequests();
  }, [db]);

  const handleDeleteApproved = async (id: string) => {
    try {
      await deleteDoc(doc(db, "partners", id));
      setApprovedRequests(approvedRequests.filter(r => r.id !== id));
      setSelectedPartner(null);
    } catch (error) {
      console.error("Error deleting approved partner: ", error);
    }
  };

  const DetailItem = ({ label, value }: { label: string, value: any }) => (
    <div>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="text-md break-words">{value || 'N/A'}</p>
    </div>
  );

  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Partner Applications</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Business Name</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedRequests.map(request => (
                <TableRow key={request.id} onClick={() => setSelectedPartner(request)} className="cursor-pointer">
                  <TableCell>
                    <Image src={request.logoUrl} alt={request.businessName} width={40} height={40} className="rounded-md object-contain" />
                  </TableCell>
                  <TableCell className="font-medium">{request.businessName}</TableCell>
                  <TableCell>{request.categories?.join(", ")}</TableCell>
                  <TableCell>{request.contactEmail}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Approved</Badge>
                  </TableCell>
                  <TableCell>{request.createdAt?.seconds ? new Date(request.createdAt.seconds * 1000).toLocaleString() : (request.createdAt ? request.createdAt.toString() : "-")}</TableCell>
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={e => { e.stopPropagation(); handleDeleteApproved(request.id); }}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {selectedPartner && (
        <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            <button
              className="absolute right-4 top-4 z-10 rounded-full bg-white/80 hover:bg-red-500 hover:text-white text-gray-700 p-2 shadow-md transition-colors"
              onClick={() => setSelectedPartner(null)}
              aria-label="Close"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
            <DialogHeader className="px-6 pt-6">
              <DialogTitle className="font-headline text-2xl flex items-center gap-4">
                <Image src={selectedPartner.logoUrl} alt={selectedPartner.businessName} width={50} height={50} className="rounded-lg object-contain" />
                {selectedPartner.businessName}
              </DialogTitle>
              <DialogDescription>{selectedPartner.categories?.join(", ")}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 px-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-muted-foreground mb-6">{selectedPartner.description}</p>
                <h3 className="font-semibold text-lg mb-2">Contact Information</h3>
                <DetailItem label="Contact Name" value={selectedPartner.partnerName} />
                <DetailItem label="Email" value={selectedPartner.contactEmail} />
                <DetailItem label="Phone" value={selectedPartner.phone} />
                <DetailItem label="Website" value={selectedPartner.website ? <a href={selectedPartner.website} target="_blank" rel="noreferrer" className="text-primary underline">Link</a> : 'N/A'} />
                <DetailItem label="Social Media" value={selectedPartner.socialMedia ? <a href={selectedPartner.socialMedia} target="_blank" rel="noreferrer" className="text-primary underline">Link</a> : 'N/A'} />
              </div>
              <div>
                <DetailItem label="Categories" value={selectedPartner.categories?.join(", ") || 'N/A'} />
                <DetailItem label="Payment Method" value={selectedPartner.paymentMethod} />
                {selectedPartner.createdAt && (
                  <DetailItem label="Created At" value={selectedPartner.createdAt?.seconds ? new Date(selectedPartner.createdAt.seconds * 1000).toLocaleString() : selectedPartner.createdAt.toString()} />
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 