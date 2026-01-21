"use client";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, X, Settings, Wrench, Shield, Package, Car, Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface ServiceRequest {
  id: string;
  serviceName: string;
  serviceType: string;
  description: string;
  location: string;
  priceRange: string;
  contactInfo: string;
  phoneNumber?: string;
  websiteUrl?: string;
  coverageArea?: string;
  businessHours?: string;
  specializations?: string;
  experience?: string;
  certifications?: string;
  imageUrls: string[];
  status: "pending" | "approved" | "rejected";
  submittedAt: any;
  userId: string;
  userEmail: string;
}

const getServiceTypeIcon = (serviceType: string) => {
  const type = serviceType.toLowerCase();
  if (type.includes('storage')) return Shield;
  if (type.includes('garage')) return Wrench;
  if (type.includes('parts')) return Package;
  if (type.includes('restoration')) return Car;
  if (type.includes('detailing')) return Palette;
  return Settings;
};

export default function PendingServicesPage() {
  const [pendingRequests, setPendingRequests] = useState<ServiceRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceRequest | null>(null);
  const [tab, setTab] = useState("pending");
  const db = getFirestore(app);

  // Feature modal state
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [featureTargetId, setFeatureTargetId] = useState<string | null>(null);
  const [featureEnd, setFeatureEnd] = useState<string>("");

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      // Fetch pending services
      const pendingSnapshot = await getDocs(collection(db, "pendingOthers"));
      const pendingData = pendingSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ServiceRequest));
      setPendingRequests(pendingData);
      // Fetch approved services
      const approvedSnapshot = await getDocs(collection(db, "others"));
      const approvedData = approvedSnapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as ServiceRequest))
        .filter(service => service.status === "approved");
      setApprovedRequests(approvedData);
      setLoading(false);
    };
    fetchRequests();
  }, [db]);

  const sendApprovalEmail = async (
    listingType: 'service',
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

  const handleApprove = async (request: ServiceRequest) => {
    try {
      // When approving, transfer the relevant fields to the 'others' collection
      const approvedServiceData: Omit<ServiceRequest, 'id' | 'status' | 'submittedAt'> = {
          serviceName: request.serviceName,
          serviceType: request.serviceType,
          description: request.description,
          location: request.location,
          priceRange: request.priceRange,
          contactInfo: request.contactInfo,
          phoneNumber: request.phoneNumber,
          websiteUrl: request.websiteUrl,
          coverageArea: request.coverageArea,
          businessHours: request.businessHours,
          specializations: request.specializations,
          experience: request.experience,
          certifications: request.certifications,
          imageUrls: request.imageUrls,
          userId: request.userId,
          userEmail: request.userEmail,
      };
      // Remove undefined fields so Firestore doesn't get undefined values
      const cleaned: Record<string, any> = Object.fromEntries(
        Object.entries(approvedServiceData).filter(([, v]) => v !== undefined)
      );
      await addDoc(collection(db, "others"), { ...cleaned, status: "approved", submittedAt: request.submittedAt, createdAt: new Date() });
      await deleteDoc(doc(db, "pendingOthers", request.id));
      setPendingRequests(pendingRequests.filter(r => r.id !== request.id));
      setSelectedService(null); // Close modal after action
      await sendApprovalEmail('service', 'approved', request.userEmail || null, request.serviceName);
    } catch (error) {
      console.error("Error approving service: ", error);
    }
  };

  const handleReject = async (request: ServiceRequest) => {
    try {
        // For rejection, you might want to move to a rejected collection
        // or simply delete. Here we delete.
        await deleteDoc(doc(db, "pendingOthers", request.id));
        setPendingRequests(pendingRequests.filter(r => r.id !== request.id));
        setSelectedService(null); // Close modal after action
        await sendApprovalEmail('service', 'rejected', request.userEmail || null, request.serviceName);
    } catch (error) {
        console.error("Error rejecting service: ", error);
    }
  };

  const handleDelete = async (id: string) => {
      try {
          await deleteDoc(doc(db, "pendingOthers", id));
          setPendingRequests(pendingRequests.filter(r => r.id !== id));
           setSelectedService(null); // Close modal after action
      } catch (error) {
          console.error("Error deleting service: ", error);
      }
  };

  const handleRowClick = (request: ServiceRequest) => {
      setSelectedService(request);
  };

  // Add this function to handle deleting approved services
  const handleDeleteApproved = async (id: string) => {
    try {
      await deleteDoc(doc(db, "others", id));
      setApprovedRequests(approvedRequests.filter(r => r.id !== id));
      setSelectedService(null);
    } catch (error) {
      console.error("Error deleting approved service: ", error);
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
      await updateDoc(doc(db, "others", featureTargetId), {
        featured: true,
        feature_start: new Date(),
        feature_end: endDate,
      });
      setFeatureDialogOpen(false);
      setFeatureTargetId(null);
      setFeatureEnd("");
    } catch (error) {
      console.error("Error setting featured service:", error);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Service Requests</h1>
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
                  <TableHead>Service Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Feature End</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map(request => {
                  const ServiceTypeIcon = getServiceTypeIcon(request.serviceType);
                  return (
                    <TableRow key={request.id} onClick={() => handleRowClick(request)} className="cursor-pointer transition-colors hover:bg-muted hover:text-primary">
                      <TableCell>
                        {request.imageUrls && request.imageUrls.length > 0 ? (
                          <Image src={request.imageUrls[0]} alt={request.serviceName} width={50} height={30} className="rounded-md object-cover" />
                        ) : (
                          <div className="w-[50px] h-[30px] bg-gray-200 rounded-md flex items-center justify-center">
                            <ServiceTypeIcon className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{request.serviceName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.serviceType}</Badge>
                      </TableCell>
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
                  );
                })}
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
                  <TableHead>Service Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedRequests.map(request => {
                  const ServiceTypeIcon = getServiceTypeIcon(request.serviceType);
                  return (
                    <TableRow key={request.id} onClick={() => handleRowClick(request)} className="cursor-pointer transition-colors hover:bg-muted hover:text-primary">
                      <TableCell>
                        {request.imageUrls && request.imageUrls.length > 0 ? (
                          <Image src={request.imageUrls[0]} alt={request.serviceName} width={50} height={30} className="rounded-md object-cover" />
                        ) : (
                          <div className="w-[50px] h-[30px] bg-gray-200 rounded-md flex items-center justify-center">
                            <ServiceTypeIcon className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{request.serviceName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.serviceType}</Badge>
                      </TableCell>
                      <TableCell>{request.location}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Approved</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={request.featured ? 'default' : 'outline'}>
                          {request.featured ? 'Yes' : 'No'}
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )
      )}
      {tab === "denied" && (
        <div className="p-8 text-center text-muted-foreground">
          <h2 className="text-xl font-semibold mb-2">Denied Services</h2>
          <p>Denied services are not stored. Once denied, a service is permanently removed from the system.</p>
        </div>
      )}
      {/* Service Details Modal */}
      <Dialog open={selectedService !== null} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <button
            className="absolute right-4 top-4 z-10 rounded-full bg-white/80 hover:bg-red-500 hover:text-white text-gray-700 p-2 shadow-md transition-colors"
            onClick={() => setSelectedService(null)}
            aria-label="Close"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="font-headline text-2xl">{selectedService?.serviceName}</DialogTitle>
            <DialogDescription>Details of the service submission.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 px-6">
            <div>
              {selectedService?.imageUrls && selectedService.imageUrls.length > 0 && (
                <div className="mb-6">
                  <Image src={selectedService.imageUrls[0]} alt={selectedService.serviceName} width={800} height={400} className="rounded-lg object-cover w-full max-h-96" />
                </div>
              )}
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-muted-foreground mb-4">{selectedService?.description}</p>
              {selectedService?.specializations && (
                <>
                  <h3 className="font-semibold text-lg mb-2">Specializations</h3>
                  <p className="text-muted-foreground mb-4">{selectedService.specializations}</p>
                </>
              )}
              {selectedService?.certifications && (
                <>
                  <h3 className="font-semibold text-lg mb-2">Certifications</h3>
                  <p className="text-muted-foreground mb-4">{selectedService.certifications}</p>
                </>
              )}
            </div>
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Service Type</p>
                  <p className="text-md">{selectedService?.serviceType}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Location</p>
                  <p className="text-md">{selectedService?.location}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Price Range</p>
                  <p className="text-md">{selectedService?.priceRange}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Contact</p>
                  <p className="text-md">{selectedService?.contactInfo}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Phone</p>
                  <p className="text-md">{selectedService?.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Website</p>
                  <p className="text-md">{selectedService?.websiteUrl ? <a href={selectedService.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{selectedService.websiteUrl}</a> : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Coverage Area</p>
                  <p className="text-md">{selectedService?.coverageArea || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Business Hours</p>
                  <p className="text-md">{selectedService?.businessHours || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Experience</p>
                  <p className="text-md">{selectedService?.experience || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">User Email</p>
                  <p className="text-md">{selectedService?.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">User ID</p>
                  <p className="text-md text-xs">{selectedService?.userId}</p>
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Status</h3>
              <Badge variant={selectedService?.status === 'pending' ? 'default' : selectedService?.status === 'approved' ? 'secondary' : 'destructive'}>{selectedService?.status}</Badge>

              <h3 className="font-semibold text-lg mb-2 mt-6">Uploaded By</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">User ID:</span> {selectedService?.userId || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {selectedService?.userEmail || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feature Service Modal */}
      <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature Service</DialogTitle>
            <DialogDescription>Choose when the featured status should end.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="featureEndService" className="text-sm">Feature end</label>
            <Input id="featureEndService" type="datetime-local" value={featureEnd} onChange={(e) => setFeatureEnd(e.target.value)} />
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