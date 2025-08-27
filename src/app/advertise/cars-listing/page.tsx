"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Car, Star, Zap, Crown, Info, Eye, MoreHorizontal, Calendar, MapPin, Tag, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { loadStripe } from "@stripe/stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import EditListingDialog from "@/components/EditListingDialog";

// Car listing pricing tiers
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const paypalOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "AW2LLf5-BoTh1ZUKUhs8Ic7nmIfH49BV92y-960SIzcvrO4vlDpLtNKe--xYpNB9Yb3xn7XONXJbErNv",
  currency: "EUR",
  intent: "capture",
};
const CAR_LISTING_TIERS = [
  {
    name: "Basic Listing",
    key: "basicListing",
    price: "CHF 39 / EUR 42",
    priceEUR: 42,
    icon: Car,
    features: [
      "Basic listing with essential details",
      "Car model, price, 5 images",
      "Great visibility at an affordable price"
    ]
  },
  {
    name: "Enhanced Listing",
    key: "enhancedListing",
    price: "CHF 69 / EUR 74",
    priceEUR: 74,
    icon: Star,
    features: [
      "Everything in Basic Listing, plus:",
      "Up to 10 images",
      "Priority placement on the website",
      "Visibility across social media platforms"
    ]
  },
  {
    name: "Premium Listing",
    key: "premiumListing",
    price: "CHF 99 / EUR 107",
    priceEUR: 107,
    icon: Zap,
    features: [
      "Everything in Enhanced Listing, plus:",
      "Up to 10 images",
      "Professional video or virtual tour",
      "Priority placement on homepage",
      "Featured across social media platforms"
    ]
  },
  {
    name: "Exclusive Banner Placement",
    key: "exclusiveBanner",
    price: "CHF 149 / EUR 161",
    priceEUR: 161,
    icon: Crown,
    features: [
      "Prominently featured on homepage banner",
      "Featured across key categories",
      "Maximum exposure to potential buyers",
      "Enhanced visibility for up to 30 days"
    ]
  }
];

export default function CarsListingPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [cars, setCars] = useState<any[]>([]);
  const [advertiseModal, setAdvertiseModal] = useState<{ open: boolean; col: string; id: string } | null>(null);
  const [advertiseLoading, setAdvertiseLoading] = useState(false);
  const [selectedFeatureType, setSelectedFeatureType] = useState<'standard' | 'featured' | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const router = useRouter();

  // Add payment modal state
  const [creditPaymentModal, setCreditPaymentModal] = useState<{ open: boolean; tierKey: string | null }>({ open: false, tierKey: null });
  const [creditPaymentStep, setCreditPaymentStep] = useState<'selectTier' | 'selectPayment' | 'pay'>('selectTier');
  const [creditSelectedTier, setCreditSelectedTier] = useState<any>(null);
  const [creditSelectedPayment, setCreditSelectedPayment] = useState<'stripe' | 'paypal' | null>(null);
  const [creditProcessing, setCreditProcessing] = useState(false);
  const [creditPaymentError, setCreditPaymentError] = useState<string | null>(null);

  const { toast } = useToast();
  const [editModal, setEditModal] = useState<{
    open: boolean;
    col: string;
    id: string;
    fieldName: string;
    label: string;
    currentValue?: string;
  } | null>(null);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const db = getFirestore(app);
    const fetchAll = async () => {
      setLoading(true);
      // Helper to fetch and filter by user
      const fetchByUser = async (col: string) => {
        const snap = await getDocs(collection(db, col));
        return snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (item: any) =>
              item.uploadedByUserId === currentUser.uid ||
              item.uploadedByUserEmail === currentUser.email
          );
      };
      
      // Fetch user document for car listings
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserDoc(userSnap.exists() ? userSnap.data() : null);
      
      const carsData = await fetchByUser("cars");
      setCars(carsData);
      setLoading(false);
    };
    fetchAll();
  }, [currentUser]);

  // Handle success/cancel from Stripe checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === '1') {
      toast({
        title: "Payment Successful!",
        description: "Your car listing credit has been added to your account.",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (canceled === '1') {
      toast({
        title: "Payment Canceled",
        description: "Your payment was canceled. You can try again anytime.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  const handleDeactivate = async (col: string, id: string) => {
    const db = getFirestore(app);
    await updateDoc(doc(db, col, id), { deactivated: true });
    // Refresh the data
    if (currentUser) {
      const fetchByUser = async (col: string) => {
        const snap = await getDocs(collection(db, col));
        return snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (item: any) =>
              item.uploadedByUserId === currentUser.uid ||
              item.uploadedByUserEmail === currentUser.email
          );
      };
      setCars(await fetchByUser("cars"));
    }
  };

  const handleAdvertise = async (col: string, id: string) => {
    setAdvertiseLoading(true);
    const db = getFirestore(app);
    
    // Check if user has remaining Credit for the selected feature type
    if (selectedFeatureType === 'standard' && (!userDoc || userDoc.standardListingRemaining <= 0)) {
      alert("You don't have enough Standard Listing Credit remaining.");
      setAdvertiseLoading(false);
      return;
    }
    if (selectedFeatureType === 'featured' && (!userDoc || userDoc.featuredListingRemaining <= 0)) {
      alert("You don't have enough Featured Listing Credit remaining.");
      setAdvertiseLoading(false);
      return;
    }

    // Calculate feature end date based on type
    const now = new Date();
    const featureStart = now;
    let featureEnd;
    
    if (selectedFeatureType === 'standard') {
      featureEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 1 month
    } else {
      featureEnd = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
    }

    await updateDoc(doc(db, col, id), { 
      featured: true,
      feature_type: selectedFeatureType,
      feature_start: featureStart,
      feature_end: featureEnd
    });
    
    // Decrement the user's Credit
    if (selectedFeatureType === 'standard') {
      await updateDoc(doc(db, "users", currentUser!.uid), {
        standardListingRemaining: (userDoc?.standardListingRemaining || 0) - 1
      });
      // Update local state immediately
      setUserDoc((prev: any) => prev ? {
        ...prev,
        standardListingRemaining: (prev.standardListingRemaining || 0) - 1
      } : null);
    } else {
      await updateDoc(doc(db, "users", currentUser!.uid), {
        featuredListingRemaining: (userDoc?.featuredListingRemaining || 0) - 1
      });
      // Update local state immediately
      setUserDoc((prev: any) => prev ? {
        ...prev,
        featuredListingRemaining: (prev.featuredListingRemaining || 0) - 1
      } : null);
    }
    
    setAdvertiseLoading(false);
    setAdvertiseModal(null);
    setSelectedFeatureType(null);
    setShowSuccessMessage(true);
    
    // Refresh the data
    if (currentUser) {
      const fetchByUser = async (col: string) => {
        const snap = await getDocs(collection(db, col));
        return snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (item: any) =>
              item.uploadedByUserId === currentUser.uid ||
              item.uploadedByUserEmail === currentUser.email
          );
      };
      setCars(await fetchByUser("cars"));
      
      // Refresh user document
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserDoc(userSnap.exists() ? userSnap.data() : null);
    }
  };

  const getUserName = () =>
    currentUser?.displayName || currentUser?.email || "User";

  const activeListingsCount = cars.filter((c) => !c.deactivated).length;
  const activeAdsCount = cars.filter((c) => c.featured && !c.deactivated).length;

  const tableData = {
    label: "Cars Listing",
    data: cars,
    columns: [
      { label: "Name", key: (c: any) => `${c.year} ${c.make} ${c.model}` },
      { label: "Price", key: (c: any) => c.price && c.currency ? `${c.currency} ${c.price}` : "N/A" },
      { label: "Location", key: "location" },
      { label: "Status", key: "status" },
      { label: "Type", key: "type" },
      { label: "Deactivated", key: "deactivated" },
    ],
    col: "cars",
    viewPath: "/cars/",
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Listing featured successfully! Your Credit has been updated.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold font-headline">Cars Listing</h1>
          <p className="mt-2 text-muted-foreground">Welcome back, {getUserName()}!</p>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-lg animate-pulse">Loading your car listings...</div>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{tableData.label}</CardTitle>
                <CardDescription>Manage your {tableData.label.toLowerCase()} here.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  variant="default" 
                  className="w-full sm:w-auto"
                  onClick={() => setCreditPaymentModal({ open: true, tierKey: null })}
                >
                  Buy More Credit
                </Button>
                <Button 
                  variant="default" 
                  className="w-full sm:w-auto"
                  onClick={() => router.push('/advertise/cars')}
                >
                  View Plans
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={() => router.push('/cars/sell')}
                >
                  List your car
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add current car listings cards */}
            {userDoc && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Your Current Car Listing Credit</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {CAR_LISTING_TIERS.map((tier) => (
                    <div key={tier.name} className="text-center p-3 bg-muted rounded">
                      <p className="text-sm font-medium">{tier.name}</p>
                      <p className="text-lg font-bold text-primary">
                        {userDoc[`cars_${tier.key}`] || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Listings Grid */}
            {cars.length === 0 ? (
              <div className="text-center py-12">
                <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No car listings found</h3>
                <p className="text-muted-foreground mb-4">Start by creating your first car listing.</p>
                <Button onClick={() => router.push('/cars/sell')}>
                  Create First Car Listing
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cars.map((car) => (
                  <Card key={car.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {car.year && car.make && car.model ? `${car.year} ${car.make} ${car.model}` : 'Unnamed Car'}
                          </CardTitle>
                          <CardDescription className="truncate">{car.location || 'Location TBD'}</CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-foreground"
                              onClick={() =>
                                setEditModal({
                                  open: true,
                                  col: "cars",
                                  id: car.id,
                                  fieldName: "location",
                                  label: "Location",
                                  currentValue: car.location || "",
                                })
                              }
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/cars/${car.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeactivate('cars', car.id)}
                              disabled={car.deactivated}
                            >
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Price:</span>
                          <span className="truncate">
                            {car.price && car.currency ? `${car.currency} ${car.price}` : 'Price TBD'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Location:</span>
                          <span className="truncate">{car.location || 'TBD'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Tag className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Listing Type:</span>
                          <Badge variant="outline">
                            {car.listing_type || 'Standard'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Tag className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={car.status === 'approved' ? 'default' : 'secondary'}>
                            {car.status || 'Pending'}
                          </Badge>
                        </div>

                        {car.deactivated && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="destructive">Deactivated</Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Modal for Buying Credits */}
      <Dialog open={creditPaymentModal.open} onOpenChange={(open) => {
        if (!open) {
          setCreditPaymentModal({ open: false, tierKey: null });
          setCreditPaymentStep('selectTier');
          setCreditSelectedTier(null);
          setCreditSelectedPayment(null);
          setCreditPaymentError(null);
        }
      }}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buy Car Listing Credit</DialogTitle>
            <DialogDescription>
              {creditPaymentStep === 'selectTier' && 'Choose a listing plan to buy credit for.'}
              {creditPaymentStep === 'selectPayment' && creditSelectedTier && `Buy 1 credit for ${creditSelectedTier.name} (${creditSelectedTier.price})`}
              {creditPaymentStep === 'pay' && creditSelectedPayment === 'stripe' && 'Pay securely with your card.'}
              {creditPaymentStep === 'pay' && creditSelectedPayment === 'paypal' && 'Pay securely with PayPal.'}
            </DialogDescription>
          </DialogHeader>
          {/* Step 1: Choose plan */}
          {creditPaymentStep === 'selectTier' && (
            <div className="flex flex-col gap-3 py-4">
              <div className="flex justify-end mb-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push('/advertise/cars')}
                >
                  View Listing Type Details
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {CAR_LISTING_TIERS.map((tier) => (
                  <button
                    key={tier.key}
                    type="button"
                    className={`w-full border rounded-lg p-3 text-left transition-all duration-150 ${creditSelectedTier?.key === tier.key ? 'border-primary bg-primary/5 shadow-lg' : 'border-muted bg-background hover:bg-muted'} focus:outline-none`}
                    onClick={() => {
                      setCreditSelectedTier(tier);
                      setCreditPaymentStep('selectPayment');
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {tier.icon && <span className="text-primary"><tier.icon className="w-5 h-5" /></span>}
                      <span className="font-semibold text-base">{tier.name}</span>
                      <span className="ml-auto font-bold text-primary text-sm">{tier.price}</span>
                    </div>
                    <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
                      {tier.features.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Step 2: Choose payment method */}
          {creditPaymentStep === 'selectPayment' && creditSelectedTier && (
            <div className="flex flex-col gap-4 py-4">
              <div className="flex items-center gap-4">
                <input
                  type="radio"
                  id="pay-stripe-credit"
                  name="payment-method-credit"
                  value="stripe"
                  checked={creditSelectedPayment === 'stripe'}
                  onChange={() => setCreditSelectedPayment('stripe')}
                />
                <Label htmlFor="pay-stripe-credit">Pay with Card (Stripe)</Label>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="radio"
                  id="pay-paypal-credit"
                  name="payment-method-credit"
                  value="paypal"
                  checked={creditSelectedPayment === 'paypal'}
                  onChange={() => setCreditSelectedPayment('paypal')}
                />
                <Label htmlFor="pay-paypal-credit">Pay with PayPal</Label>
              </div>
              <Button
                className="w-full mt-4"
                onClick={async () => {
                  if (!creditSelectedPayment) {
                    setCreditPaymentError('Please select a payment method.');
                    return;
                  }
                  setCreditProcessing(true);
                  setCreditPaymentError(null);
                  const amount = creditSelectedTier.priceEUR;
                  const description = creditSelectedTier.name;
                  if (creditSelectedPayment === 'stripe') {
                    const res = await fetch('/api/payment/stripe-checkout-session', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        amount, 
                        description, 
                        email: currentUser?.email,
                        returnUrl: window.location.href
                      }),
                    });
                    const data = await res.json();
                    if (data.url) {
                      window.location.href = data.url; // Redirect to Stripe Checkout
                      return;
                    } else {
                      setCreditPaymentError(data.error || 'Failed to create Stripe Checkout session.');
                    }
                    setCreditProcessing(false);
                  } else if (creditSelectedPayment === 'paypal') {
                    setCreditPaymentStep('pay');
                    setCreditProcessing(false);
                  }
                }}
                disabled={creditProcessing}
              >
                Continue
              </Button>
              {creditPaymentError && <div className="text-red-500 text-sm mt-2">{creditPaymentError}</div>}
            </div>
          )}
          {/* Step 3: Payment form */}
          {creditPaymentStep === 'pay' && creditSelectedTier && (
            <div className="flex flex-col gap-4 py-4">
              {creditSelectedPayment === 'stripe' ? (
                <div className="text-center">
                  <p className="text-lg font-semibold">€{creditSelectedTier.priceEUR}</p>
                  <p className="text-sm text-muted-foreground">{creditSelectedTier.name}</p>
                  <p className="text-sm text-muted-foreground mt-2">Redirecting to Stripe Checkout...</p>
                </div>
              ) : creditSelectedPayment === 'paypal' ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-lg font-semibold">€{creditSelectedTier.priceEUR}</p>
                    <p className="text-sm text-muted-foreground">{creditSelectedTier.name}</p>
                  </div>
                  <PayPalScriptProvider options={paypalOptions}>
                    <PayPalButtons
                      createOrder={async (data: any, actions: any) => {
                        const amount = creditSelectedTier.priceEUR;
                        const description = creditSelectedTier.name;
                        const res = await fetch('/api/payment/paypal-order', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ amount, description }),
                        });
                        const orderData = await res.json();
                        if (!orderData.orderId) {
                          throw new Error(orderData.error || 'Failed to create PayPal order');
                        }
                        return orderData.orderId;
                      }}
                      onApprove={async (data: any, actions: any) => {
                        try {
                          const res = await fetch('/api/payment/paypal-capture', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: data.orderID }),
                          });
                          const captureData = await res.json();
                          if (captureData.success) {
                            // Update Firestore and local state
                            const db = getFirestore(app);
                            const quotaField = `cars_${creditSelectedTier.key}`;
                            await updateDoc(doc(db, "users", currentUser!.uid), {
                              [quotaField]: (userDoc?.[quotaField] || 0) + 1
                            });
                            setUserDoc((prev: any) => prev ? {
                              ...prev,
                              [quotaField]: (prev[quotaField] || 0) + 1
                            } : null);
                            setCreditPaymentModal({ open: false, tierKey: null });
                            setCreditPaymentStep('selectTier');
                            setCreditSelectedTier(null);
                            setCreditSelectedPayment(null);
                            setCreditPaymentError(null);
                            setShowSuccessMessage(true);
                            toast({
                              title: "Credit purchased!",
                              description: `You have successfully purchased 1 credit for ${creditSelectedTier.name}.`,
                            });
                            return Promise.resolve();
                          } else {
                            throw new Error(captureData.error || 'Payment capture failed');
                          }
                        } catch (error: any) {
                          setCreditPaymentError(error.message || 'Payment failed');
                          toast({
                            title: "Payment failed",
                            description: error.message || 'Payment failed',
                            variant: "destructive",
                          });
                          return Promise.reject(error);
                        }
                      }}
                      onError={(err: any) => {
                        setCreditPaymentError('PayPal error: ' + (err?.message || 'Unknown error'));
                        toast({
                          title: "Payment failed",
                          description: 'PayPal error: ' + (err?.message || 'Unknown error'),
                          variant: "destructive",
                        });
                      }}
                      style={{ layout: "vertical" }}
                    />
                  </PayPalScriptProvider>
                </div>
              ) : null}
              {creditPaymentError && <div className="text-red-500 text-sm mt-2">{creditPaymentError}</div>}
              <Button
                variant="outline"
                onClick={() => setCreditPaymentStep('selectPayment')}
                className="w-full"
              >
                Back
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditPaymentModal({ open: false, tierKey: null })}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EditListingDialog
        open={!!editModal?.open}
        onOpenChange={(o) => {
          if (!o) setEditModal(null);
        }}
        collectionName={editModal?.col || "cars"}
        documentId={editModal?.id || ""}
        fieldName={editModal?.fieldName || "location"}
        label={editModal?.label || "Location"}
        currentValue={editModal?.currentValue || ""}
        placeholder="Enter new location"
        helpText="Update where the car is located."
        onSaved={(newVal) => {
          setCars((prev) => prev.map((c) => (c.id === editModal?.id ? { ...c, [editModal!.fieldName]: newVal } : c)));
        }}
      />
    </div>
  );
} 