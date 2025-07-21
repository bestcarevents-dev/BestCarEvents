"use client";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";

interface EventRequest {
  id: string;
  eventName: string;
  eventDate: any;
  location: string;
  description: string;
  organizerName: string;
  organizerContact: string;
  imageUrl: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: any;
}

export default function PendingEventsPage() {
  const [requests, setRequests] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "pendingEvents"));
      const requestsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventRequest));
      setRequests(requestsData);
      setLoading(false);
    };
    fetchRequests();
  }, [db]);

  const handleApprove = async (request: EventRequest) => {
    try {
      const eventData = { ...request, status: "approved" };
      await addDoc(collection(db, "events"), eventData);
      await deleteDoc(doc(db, "pendingEvents", request.id));
      setRequests(requests.filter(r => r.id !== request.id));
    } catch (error) {
      console.error("Error approving event: ", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
        const requestRef = doc(db, "pendingEvents", id);
        await updateDoc(requestRef, { status: "rejected" });
        // You might want to move this to a 'rejectedEvents' collection or just update status
        // For this example, we'll just remove it from the list
        setRequests(requests.filter(r => r.id !== id));
    } catch (error) {
        console.error("Error rejecting event: ", error);
    }
  };


  return (
      <>
        <h1 className="text-2xl font-semibold mb-4">Pending Event Requests</h1>
        {loading ? (
            <p>Loading...</p>
        ) : (
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Event Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests.map(request => (
                <TableRow key={request.id}>
                    <TableCell>
                        <Image src={request.imageUrl} alt={request.eventName} width={100} height={50} className="rounded-md object-cover" />
                    </TableCell>
                    <TableCell>{request.eventName}</TableCell>
                    <TableCell>{new Date(request.eventDate.seconds * 1000).toLocaleDateString()}</TableCell>
                    <TableCell>{request.location}</TableCell>
                    <TableCell>{request.organizerName}</TableCell>
                    <TableCell>
                        <Badge variant={request.status === 'pending' ? 'default' : 'outline'}>{request.status}</Badge>
                    </TableCell>
                    <TableCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleApprove(request)}>Approve</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReject(request.id)}>Reject</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        )}
      </>
  );
}
