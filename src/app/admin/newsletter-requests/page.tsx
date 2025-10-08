"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface NewsletterRequest {
  id: string;
  type: "standard" | "premium";
  title: string;
  description: string;
  websiteUrl?: string;
  images: string[];
  status: "pending" | "approved" | "rejected";
  createdAt: any;
  uploadedByUser: string;
  uploadedByUserEmail: string;
}

export default function NewsletterRequestsPage() {
  const [requests, setRequests] = useState<NewsletterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<NewsletterRequest | null>(null);
  const [tab, setTab] = useState("approved");
  const db = getFirestore(app);
  
  const sendApprovalEmail = async (
    action: 'approved' | 'rejected',
    to?: string | null,
    listingName?: string
  ) => {
    try {
      if (!to) return;
      await fetch('/api/emails/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, listingType: 'newsletter', action, listingName })
      });
    } catch (e) {
      console.error('Failed to send newsletter approval email:', e);
    }
  };

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "newsletterrequests"));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsletterRequest));
      setRequests(data);
      setLoading(false);
    };
    fetchRequests();
  }, [db]);

  // Approval is automatic on submission; no manual approve action needed

  const handleReject = async (id: string) => {
    try {
      await updateDoc(doc(db, "newsletterrequests", id), {
        status: "rejected"
      });
      setRequests(requests.map(r => r.id === id ? { ...r, status: "rejected" } : r));
      const req = requests.find(r => r.id === id);
      setSelectedRequest(null);
      if (req) {
        await sendApprovalEmail('rejected', req.uploadedByUserEmail, req.title);
      }
    } catch (error) {
      console.error("Error rejecting request: ", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "newsletterrequests", id));
      setRequests(requests.filter(r => r.id !== id));
      setSelectedRequest(null);
    } catch (error) {
      console.error("Error deleting request: ", error);
    }
  };

  const handleRowClick = (request: NewsletterRequest) => {
    setSelectedRequest(request);
  };

  const filteredRequests = requests.filter(request => {
    if (tab === "approved") return request.status === "approved";
    if (tab === "rejected") return request.status === "rejected";
    return true;
  });

  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Newsletter Requests</h1>
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map(request => (
                <TableRow key={request.id} onClick={() => handleRowClick(request)} className="cursor-pointer transition-colors hover:bg-muted hover:text-primary">
                  <TableCell>
                    <Badge variant={request.type === "premium" ? "default" : "secondary"}>
                      {request.type === "premium" ? "Premium" : "Standard"}
                    </Badge>
                  </TableCell>
                  <TableCell>{request.title}</TableCell>
                  <TableCell>{request.uploadedByUser}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        request.status === "approved" ? "default" : 
                        request.status === "rejected" ? "destructive" : "secondary"
                      }
                    >
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {request.createdAt?.seconds 
                      ? new Date(request.createdAt.seconds * 1000).toLocaleDateString('en-GB')
                      : "N/A"
                    }
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
                        <DropdownMenuItem onClick={() => handleReject(request.id)}>Reject</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(request.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Request Details Modal */}
      <Dialog open={selectedRequest !== null} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <button
            className="absolute right-4 top-4 z-10 rounded-full bg-white/80 hover:bg-red-500 hover:text-white text-gray-700 p-2 shadow-md transition-colors"
            onClick={() => setSelectedRequest(null)}
            aria-label="Close"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="font-headline text-2xl">{selectedRequest?.title}</DialogTitle>
            <DialogDescription>Details of the newsletter request.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 px-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-muted-foreground mb-4">{selectedRequest?.description}</p>
              
              {selectedRequest?.images && selectedRequest.images.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Images ({selectedRequest.images.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {selectedRequest.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Image ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                          Image {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Type</p>
                  <Badge variant={selectedRequest?.type === "premium" ? "default" : "secondary"}>
                    {selectedRequest?.type === "premium" ? "Premium" : "Standard"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Status</p>
                  <Badge 
                    variant={
                      selectedRequest?.status === "approved" ? "default" : 
                      selectedRequest?.status === "rejected" ? "destructive" : "secondary"
                    }
                  >
                    {selectedRequest?.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">User</p>
                  <p className="text-md">{selectedRequest?.uploadedByUser}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Email</p>
                  <p className="text-md">{selectedRequest?.uploadedByUserEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Created</p>
                  <p className="text-md">
                    {selectedRequest?.createdAt?.seconds 
                      ? new Date(selectedRequest.createdAt.seconds * 1000).toLocaleString('en-GB')
                      : "N/A"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Website</p>
                  <p className="text-md">
                    {selectedRequest?.websiteUrl ? (
                      <a 
                        href={selectedRequest.websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline break-all"
                      >
                        {selectedRequest.websiteUrl}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>
              </div>
              
              {selectedRequest?.status !== "rejected" && (
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={() => handleReject(selectedRequest!.id)}>Reject</Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 