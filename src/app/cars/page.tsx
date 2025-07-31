'use client';
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import CarCard from "@/components/car-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import PartnerAdRotator from '@/components/PartnerAdRotator';

export default function CarsPage() {
    const [cars, setCars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showDialog, setShowDialog] = useState(false);

    useEffect(() => {
      const fetchCars = async () => {
        setLoading(true);
        const db = getFirestore(app);
        const carsQuery = query(collection(db, "cars"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(carsQuery);
        const data = snapshot.docs.map(doc => ({ documentId: doc.id, ...doc.data() }));
        setCars(data);
        setLoading(false);
      };
      fetchCars();
    }, []);

    useEffect(() => {
      const auth = getAuth(app);
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
      });
      return () => unsubscribe();
    }, []);

    return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-gray-900">Cars for Sale</h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto md:mx-0">
              Browse thousands of unique cars from our curated marketplace.
            </p>
          </div>
          {currentUser ? (
            <Button asChild>
              <Link href="/cars/sell" className="flex items-center">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Sell Your Car
              </Link>
            </Button>
          ) : (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Sell Your Car
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md w-full">
                <DialogHeader>
                  <DialogTitle>Login Required</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center">
                  <p className="text-lg font-semibold mb-2 text-destructive">You must be logged in to post a listing.</p>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Close</Button>
                    </DialogClose>
                    <Button asChild variant="default">
                      <a href="/login">Login</a>
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input placeholder="Search by make, model..." className="md:col-span-2 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500" />
            <Input placeholder="Location (e.g. city, zip)" className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500" />
            <Select>
              <SelectTrigger className="bg-white border-gray-300 text-gray-900"><SelectValue placeholder="Sort by: Newest" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
            <Button>Search</Button>
          </div>
        </div>

        <div className="mb-4">
          <PartnerAdRotator page="Cars for sale" maxVisible={2} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full text-center text-lg py-12 text-gray-600">Loading...</div>
          ) : (
            cars
              .slice()
              .sort((a, b) => (b.featured === true ? 1 : 0) - (a.featured === true ? 1 : 0))
              .map((car, index) => (
                <CarCard
                  key={car.documentId || index}
                  id={car.documentId}
                  name={car.make && car.model ? `${car.year} ${car.make} ${car.model}` : car.name || "Car"}
                  price={car.price ? `$${car.price.toLocaleString()}` : "N/A"}
                  location={car.location || ""}
                  image={car.images && car.images[0] ? car.images[0] : "https://via.placeholder.com/600x400?text=No+Image"}
                  hint={car.hint || car.make || "car"}
                  featured={!!car.featured}
                />
              ))
          )}
        </div>

        <div className="mt-12">
          <Pagination>
            <PaginationContent className="bg-white border border-gray-300 rounded-lg p-1">
              <PaginationItem>
                <PaginationPrevious href="#" className="text-gray-700 hover:text-gray-900 hover:bg-gray-50" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" className="text-gray-700 hover:text-gray-900 hover:bg-gray-50">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive className="bg-yellow-600 text-white hover:bg-yellow-700">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" className="text-gray-700 hover:text-gray-900 hover:bg-gray-50">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" className="text-gray-700 hover:text-gray-900 hover:bg-gray-50" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
