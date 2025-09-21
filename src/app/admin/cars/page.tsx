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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X } from "lucide-react";

interface CarRequest {
  id: string;
  make: string;
  model: string;
  year: number;
  price: string;
  currency: string;
  mileage: number;
  vin?: string;
  bodyStyle: string;
  engine: string;
  transmission: string;
  drivetrain: string;
  exteriorColor: string;
  interiorColor: string;
  location: string;
  description: string;
  conditionDetails: string;
  features?: string[];
  sellerName: string;
  sellerContact: string;
  images: string[];
  status: "pending" | "approved" | "rejected";
  uploadedByUserEmail?: string;
  uploadedByUserId?: string;
}

export default function PendingCarsPage() {
  const [pendingRequests, setPendingRequests] = useState<CarRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<CarRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<CarRequest | null>(null);
  const [tab, setTab] = useState("pending");
  const db = getFirestore(app);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      // Fetch pending cars
      const pendingSnapshot = await getDocs(collection(db, "pendingCars"));
      const pendingData = pendingSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CarRequest));
      setPendingRequests(pendingData);
      // Fetch approved cars (all cars in 'cars' collection, no status filter)
      const approvedSnapshot = await getDocs(collection(db, "cars"));
      const approvedData = approvedSnapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as CarRequest));
      setApprovedRequests(approvedData);
      setLoading(false);
    };
    fetchRequests();
  }, [db]);

  const sendApprovalEmail = async (
    listingType: 'car',
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

  const handleApprove = async (request: CarRequest) => {
    try {
      const { id: _ignoreId, ...rest } = request;
      const carData = { ...rest, status: "approved", createdAt: new Date() };
      await addDoc(collection(db, "cars"), carData);
      await deleteDoc(doc(db, "pendingCars", request.id));
      setPendingRequests(pendingRequests.filter(r => r.id !== request.id));
      setSelectedCar(null);
      const name = `${request.year} ${request.make} ${request.model}`;
      await sendApprovalEmail('car', 'approved', request.uploadedByUserEmail || null, name);
    } catch (error) {
      console.error("Error approving car: ", error);
    }
  };

  const handleReject = async (request: CarRequest) => {
    try {
        await deleteDoc(doc(db, "pendingCars", request.id));
        setPendingRequests(pendingRequests.filter(r => r.id !== request.id));
        setSelectedCar(null);
        const name = `${request.year} ${request.make} ${request.model}`;
        await sendApprovalEmail('car', 'rejected', request.uploadedByUserEmail || null, name);
    } catch (error) {
        console.error("Error rejecting car: ", error);
    }
  };

  const handleDeleteApproved = async (id: string) => {
    try {
      await deleteDoc(doc(db, "cars", id));
      setApprovedRequests(approvedRequests.filter(r => r.id !== id));
      setSelectedCar(null);
    } catch (error) {
      console.error("Error deleting approved car: ", error);
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
        <h1 className="text-2xl font-semibold mb-4">Car Listings</h1>
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
                    <TableHead>Image</TableHead>
                    <TableHead>Make & Model</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map(request => (
                    <TableRow key={request.id} onClick={() => setSelectedCar(request)} className="cursor-pointer">
                      <TableCell>
                        <Image src={request.images[0]} alt={`${request.make} ${request.model}`} width={100} height={60} className="rounded-md object-cover" />
                      </TableCell>
                      <TableCell className="font-medium">{request.make} {request.model}</TableCell>
                      <TableCell>{request.year}</TableCell>
                      <TableCell>{request.currency} {request.price}</TableCell>
                      <TableCell>{request.sellerName}</TableCell>
                      <TableCell>
                        <Badge variant={request.status === 'pending' ? 'default' : 'outline'}>{request.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedCar(request)}}>View Details</Button>
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
                    <TableHead>Make & Model</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedRequests.map(request => (
                    <TableRow key={request.id} onClick={() => setSelectedCar(request)} className="cursor-pointer">
                      <TableCell>
                        <Image src={request.images[0]} alt={`${request.make} ${request.model}`} width={100} height={60} className="rounded-md object-cover" />
                      </TableCell>
                      <TableCell className="font-medium">{request.make} {request.model}</TableCell>
                      <TableCell>{request.year}</TableCell>
                      <TableCell>{request.currency} {request.price}</TableCell>
                      <TableCell>{request.sellerName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Approved</Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={e => { 
                            e.stopPropagation(); 
                            if (confirm('Delete this car listing permanently?')) {
                              handleDeleteApproved(request.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
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
            <h2 className="text-xl font-semibold mb-2">Denied Cars</h2>
            <p>Denied cars are not stored. Once denied, a car listing is permanently removed from the system.</p>
          </div>
        )}
        {selectedCar && (
          <Dialog open={!!selectedCar} onOpenChange={() => setSelectedCar(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
              <button
                className="absolute right-4 top-4 z-10 rounded-full bg-white/80 hover:bg-red-500 hover:text-white text-gray-700 p-2 shadow-md transition-colors"
                onClick={() => setSelectedCar(null)}
                aria-label="Close"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
              <DialogHeader className="px-6 pt-6">
                <DialogTitle className="font-headline text-2xl">{selectedCar.year} {selectedCar.make} {selectedCar.model}</DialogTitle>
                <DialogDescription>Review the details below and take action.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 px-6">
                <div>
                  <Carousel className="w-full mb-6">
                    <CarouselContent>
                      {selectedCar.images.map((img, i) => (
                        <CarouselItem key={i}>
                          <Image src={img} alt={`Car image ${i + 1}`} width={800} height={600} className="rounded-lg object-cover w-full max-h-96" />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-muted-foreground mb-4">{selectedCar.description}</p>
                  <h3 className="font-semibold text-lg mb-2">Condition</h3>
                  <p className="text-muted-foreground">{selectedCar.conditionDetails}</p>
                </div>
                <div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <DetailItem label="Price" value={`${selectedCar.currency} ${selectedCar.price}`} />
                    <DetailItem label="Mileage" value={selectedCar.mileage.toLocaleString()} />
                    <DetailItem label="VIN" value={selectedCar.vin} />
                    <DetailItem label="Body Style" value={selectedCar.bodyStyle} />
                    <DetailItem label="Engine" value={selectedCar.engine} />
                    <DetailItem label="Transmission" value={selectedCar.transmission} />
                    <DetailItem label="Drivetrain" value={selectedCar.drivetrain} />
                    <DetailItem label="Exterior Color" value={selectedCar.exteriorColor} />
                    <DetailItem label="Interior Color" value={selectedCar.interiorColor} />
                    <DetailItem label="Location" value={selectedCar.location} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Features</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedCar.features?.map(f => <Badge key={f} variant="secondary">{f}</Badge>) ?? <p>No features listed.</p>}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Seller Information</h3>
                  <DetailItem label="Name" value={selectedCar.sellerName} />
                  <DetailItem label="Contact Email" value={selectedCar.sellerContact} />
                </div>
              </div>
              {tab === "pending" && (
                <DialogFooter className="px-6 pb-6">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={() => handleReject(selectedCar)}>Reject</Button>
                  <Button onClick={() => handleApprove(selectedCar)}>Approve</Button>
                </DialogFooter>
              )}
            </DialogContent>
          </Dialog>
        )}
      </>
  );
}
