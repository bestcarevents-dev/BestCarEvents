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

interface CarRequest {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
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
}

export default function PendingCarsPage() {
  const [requests, setRequests] = useState<CarRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<CarRequest | null>(null);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "pendingCars"));
      const requestsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CarRequest));
      setRequests(requestsData);
      setLoading(false);
    };
    fetchRequests();
  }, [db]);

  const handleApprove = async (request: CarRequest) => {
    try {
      const carData = { ...request, status: "approved" };
      await addDoc(collection(db, "cars"), carData);
      await deleteDoc(doc(db, "pendingCars", request.id));
      setRequests(requests.filter(r => r.id !== request.id));
      setSelectedCar(null);
    } catch (error) {
      console.error("Error approving car: ", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
        await deleteDoc(doc(db, "pendingCars", id));
        setRequests(requests.filter(r => r.id !== id));
        setSelectedCar(null);
    } catch (error) {
        console.error("Error rejecting car: ", error);
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
        <h1 className="text-2xl font-semibold mb-4">Pending Car Listings</h1>
        {loading ? (
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
                    {requests.map(request => (
                    <TableRow key={request.id} onClick={() => setSelectedCar(request)} className="cursor-pointer">
                        <TableCell>
                            <Image src={request.images[0]} alt={`${request.make} ${request.model}`} width={100} height={60} className="rounded-md object-cover" />
                        </TableCell>
                        <TableCell className="font-medium">{request.make} {request.model}</TableCell>
                        <TableCell>{request.year}</TableCell>
                        <TableCell>${request.price.toLocaleString()}</TableCell>
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
        )}
        {selectedCar && (
            <Dialog open={!!selectedCar} onOpenChange={() => setSelectedCar(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">{selectedCar.year} {selectedCar.make} {selectedCar.model}</DialogTitle>
                        <DialogDescription>Review the details below and take action.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                        <div>
                             <Carousel className="w-full mb-6">
                                <CarouselContent>
                                    {selectedCar.images.map((img, i) => <CarouselItem key={i}><Image src={img} alt="Car image" width={800} height={600} className="rounded-lg object-cover" /></CarouselItem>)}
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
                                <DetailItem label="Price" value={`$${selectedCar.price.toLocaleString()}`} />
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
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={() => handleReject(selectedCar.id)}>Reject</Button>
                        <Button onClick={() => handleApprove(selectedCar)}>Approve</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
      </>
  );
}
