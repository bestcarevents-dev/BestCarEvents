"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Car, Star, Zap, Crown, Info, Eye, MoreHorizontal, Calendar, MapPin, Tag, Users } from "lucide-react";
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
import { Elements } from '@stripe/react-stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { usePricing } from "@/lib/usePricing";
import { validateCoupon } from "@/lib/coupon";
import HowItWorksModal from "@/components/HowItWorksModal";
import { Badge } from "@/components/ui/badge";
import EventEditDialog from "@/components/edit/EventEditDialog";

export default function EventsListingPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [advertiseModal, setAdvertiseModal] = useState<{ open: boolean; col: string; id: string } | null>(null);
  const [advertiseLoading, setAdvertiseLoading] = useState(false);
  const [selectedFeatureType, setSelectedFeatureType] = useState<'standard' | 'featured' | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { get: getPrice } = usePricing();
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponInfo, setCouponInfo] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  // Payment modal state
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; col: string; id: string } | null>(null);
  const [paymentStep, setPaymentStep] = useState<'selectType' | 'selectPayment' | 'pay'>('selectType');
  const [selectedPayment, setSelectedPayment] = useState<'stripe' | 'paypal' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [attendeesModal, setAttendeesModal] = useState<{ open: boolean; attendees: Array<{ uid?: string; email?: string }> } | null>(null);
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
      
      // Fetch user document for events listings
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserDoc(userSnap.exists() ? userSnap.data() : null);
      
      const eventsData = await fetchByUser("events");
      setEvents(eventsData);
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
        description: "Your event listing credit has been added to your account.",
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
      setEvents(await fetchByUser("events"));
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
      setEvents(await fetchByUser("events"));
      
      // Refresh user document
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserDoc(userSnap.exists() ? userSnap.data() : null);
    }
  };

  // Payment handlers
  const handlePayment = async () => {
    setProcessing(true);
    setPaymentError(null);
    let amount = 0;
    let description = '';
    if (selectedFeatureType) {
      amount = selectedFeatureType === 'featured' ? getPrice('listings.featured', FEATURE_PRICES.featured) : getPrice('listings.standard', FEATURE_PRICES.standard);
      description = selectedFeatureType === 'featured' ? 'Featured Listing' : 'Standard Listing';
    }
    if (!amount || !description) {
      setPaymentError('Invalid payment details.');
      setProcessing(false);
      return;
    }
    const finalAmount = Math.max(0, amount - (couponDiscount || 0));
    if (selectedPayment === 'stripe') {
      // Call API to create Stripe Checkout session
      const res = await fetch('/api/payment/stripe-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: finalAmount, 
          description, 
          email: currentUser?.email,
          returnUrl: window.location.href,
          couponCode: couponCode || undefined,
          category: 'listings'
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
        return;
      } else {
        setPaymentError(data.error || 'Failed to create Stripe Checkout session.');
      }
      setProcessing(false);
    } else if (selectedPayment === 'paypal') {
      // Call API to create PayPal order
      const res = await fetch('/api/payment/paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: finalAmount, description, couponCode: couponCode || undefined, category: 'listings' }),
      });
      const data = await res.json();
      if (data.orderId) {
        setPaymentStep('pay');
      } else {
        setPaymentError(data.error || 'Failed to create PayPal order.');
      }
      setProcessing(false);
    }
  };
  // PayPal handlers
  const createPayPalOrder = async (data: any, actions: any) => {
    let amount = 0;
    let description = '';
    if (selectedFeatureType) {
      amount = selectedFeatureType === 'featured' ? getPrice('listings.featured', FEATURE_PRICES.featured) : getPrice('listings.standard', FEATURE_PRICES.standard);
      description = selectedFeatureType === 'featured' ? 'Featured Listing' : 'Standard Listing';
    }
    if (!amount || !description) {
      throw new Error('Invalid payment details');
    }
    const res = await fetch('/api/payment/paypal-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.max(0, amount - (couponDiscount || 0)), description, couponCode: couponCode || undefined, category: 'listings' }),
    });
    const orderData = await res.json();
    if (!orderData.orderId) {
      throw new Error(orderData.error || 'Failed to create PayPal order');
    }
    return orderData.orderId;
  };
  const onPayPalApprove = async (data: any, actions: any) => {
    try {
      const res = await fetch('/api/payment/paypal-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderID }),
      });
      const captureData = await res.json();
      if (captureData.success) {
        await handlePostPayment();
        return Promise.resolve();
      } else {
        throw new Error(captureData.error || 'Payment capture failed');
      }
    } catch (error: any) {
      setPaymentError(error.message || 'Payment failed');
      return Promise.reject(error);
    }
  };
  const onPayPalError = (err: any) => {
    setPaymentError('PayPal error: ' + (err?.message || 'Unknown error'));
  };
  // Stripe CheckoutForm
  function CheckoutForm({ onSuccess, onError, processing }: { onSuccess: () => void, onError: (msg: string) => void, processing: boolean }) {
    const stripe = useStripe();
    const elements = useElements();
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;
      const card = elements.getElement(CardElement);
      if (!card) return;
      const { error, paymentIntent } = await stripe.confirmCardPayment(stripeClientSecret!, {
        payment_method: { card },
      });
      if (error) {
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      } else {
        onError('Payment not successful');
      }
    };
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <CardElement options={{ hidePostalCode: true }} className="p-2 border rounded" />
        <Button type="submit" className="w-full" disabled={processing}>Pay</Button>
      </form>
    );
  }
  // Post-payment handler
  const handlePostPayment = async () => {
    if (!paymentModal || !selectedFeatureType) return;
    const db = getFirestore(app);
    // Increment the user's Credit
    if (selectedFeatureType === 'standard') {
      await updateDoc(doc(db, "users", currentUser!.uid), {
        standardListingRemaining: (userDoc?.standardListingRemaining || 0) + 1
      });
      setUserDoc((prev: any) => prev ? {
        ...prev,
        standardListingRemaining: (prev.standardListingRemaining || 0) + 1
      } : null);
    } else {
      await updateDoc(doc(db, "users", currentUser!.uid), {
        featuredListingRemaining: (userDoc?.featuredListingRemaining || 0) + 1
      });
      setUserDoc((prev: any) => prev ? {
        ...prev,
        featuredListingRemaining: (prev.featuredListingRemaining || 0) + 1
      } : null);
    }
    setPaymentModal(null);
    setSelectedFeatureType(null);
    setPaymentStep('selectType');
    setSelectedPayment(null);
    setStripeClientSecret(null);
    toast({
      title: "Payment Successful",
      description: `You have purchased 1 ${selectedFeatureType === 'featured' ? 'Featured' : 'Standard'} Listing Credit!`,
    });
    // Refresh user document
    if (currentUser) {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserDoc(userSnap.exists() ? userSnap.data() : null);
    }
  };

  const getUserName = () =>
    currentUser?.displayName || currentUser?.email || "User";

  const activeListingsCount = events.filter((e) => !e.deactivated).length;
  const activeAdsCount = events.filter((e) => e.featured && !e.deactivated).length;

  const tableData = {
    label: "Events Listing",
    data: events,
    columns: [
      { label: "Name", key: "eventName" },
      { label: "Date", key: "eventDate" },
      { label: "Location", key: "location" },
      { label: "Status", key: "status" },
      { label: "Featured", key: "featured" },
      { label: "Deactivated", key: "deactivated" },
    ],
    col: "events",
    viewPath: "/events/",
  };

  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "AW2LLf5-BoTh1ZUKUhs8Ic7nmIfH49BV92y-960SIzcvrO4vlDpLtNKe--xYpNB9Yb3xn7XONXJbErNv",
    currency: "EUR",
    intent: "capture",
  };
  const FEATURE_PRICES = {
    featured: 4800, // EUR
    standard: 400, // EUR
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
          <h1 className="text-4xl font-extrabold font-headline">Events Listing</h1>
          <p className="mt-2 text-muted-foreground">Welcome back, {getUserName()}!</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Active Listings</CardTitle>
            <CardDescription>All your event listings currently live.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{activeListingsCount}</p>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Featured Listings</CardTitle>
            <CardDescription>All your featured (advertised) event listings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{activeAdsCount}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12 text-lg animate-pulse">Loading your event listings...</div>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Events Listing</CardTitle>
                <CardDescription>Manage your events listing here.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <HowItWorksModal 
                  listingType="event"
                  triggerText="How it works"
                  triggerVariant="outline"
                />
                <Dialog open={paymentModal?.open} onOpenChange={(open) => {
                  if (!open) {
                    setPaymentModal(null);
                    setSelectedFeatureType(null);
                    setPaymentStep('selectType');
                    setSelectedPayment(null);
                    setStripeClientSecret(null);
                    setPaymentError(null);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="default"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        if (!currentUser) return;
                        setPaymentModal({ open: true, col: 'users', id: currentUser.uid });
                        setSelectedFeatureType(null);
                        setPaymentStep('selectType');
                        setSelectedPayment(null);
                        setStripeClientSecret(null);
                        setPaymentError(null);
                      }}
                    >
                      Buy Featured
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Buy Listing Credit</DialogTitle>
                      <DialogDescription>
                        {paymentStep === 'selectType' && 'Choose which type of listing credit you want to buy.'}
                        {paymentStep === 'selectPayment' && 'Choose a payment method to continue.'}
                        {paymentStep === 'pay' && selectedPayment === 'stripe' && 'Pay securely with your card.'}
                        {paymentStep === 'pay' && selectedPayment === 'paypal' && 'Pay securely with PayPal.'}
                      </DialogDescription>
                    </DialogHeader>
                    {/* Step 1: Choose credit type */}
                    {paymentStep === 'selectType' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            id="credit-standard"
                            name="credit-type"
                            value="standard"
                            checked={selectedFeatureType === 'standard'}
                            onChange={() => setSelectedFeatureType('standard')}
                          />
                          <Label htmlFor="credit-standard" className="flex-1">
                            <div className="font-medium">Standard Listing Credit</div>
                            <div className="text-sm text-muted-foreground">
                              1 month, €400
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            id="credit-featured"
                            name="credit-type"
                            value="featured"
                            checked={selectedFeatureType === 'featured'}
                            onChange={() => setSelectedFeatureType('featured')}
                          />
                          <Label htmlFor="credit-featured" className="flex-1">
                            <div className="font-medium">Featured Listing Credit</div>
                            <div className="text-sm text-muted-foreground">
                              1 year, €4800
                            </div>
                          </Label>
                        </div>
                        <Button
                          className="w-full mt-4"
                          onClick={() => {
                            if (!selectedFeatureType) return;
                            setPaymentStep('selectPayment');
                          }}
                          disabled={!selectedFeatureType}
                        >
                          Continue
                        </Button>
                      </div>
                    )}
                    {/* Step 2: Choose payment method */}
                    {paymentStep === 'selectPayment' && (
                      <div className="flex flex-col gap-4 py-4">
                        <div className="flex items-center gap-4">
                          <input
                            type="radio"
                            id="pay-stripe"
                            name="payment-method"
                            value="stripe"
                            checked={selectedPayment === 'stripe'}
                            onChange={() => setSelectedPayment('stripe')}
                          />
                          <Label htmlFor="pay-stripe">Pay with Card (Stripe)</Label>
                        </div>
                        <div className="flex items-center gap-4">
                          <input
                            type="radio"
                            id="pay-paypal"
                            name="payment-method"
                            value="paypal"
                            checked={selectedPayment === 'paypal'}
                            onChange={() => setSelectedPayment('paypal')}
                          />
                          <Label htmlFor="pay-paypal">Pay with PayPal</Label>
                        </div>
                        <Button
                          className="w-full mt-4"
                          onClick={async () => {
                            if (!selectedPayment) {
                              setPaymentError('Please select a payment method.');
                              return;
                            }
                            await handlePayment();
                          }}
                          disabled={processing}
                        >
                          Continue
                        </Button>
                        {paymentError && <div className="text-red-500 text-sm mt-2">{paymentError}</div>}
                      </div>
                    )}
                    {/* Step 3: Payment form */}
                    {paymentStep === 'pay' && (
                      <div className="flex flex-col gap-4 py-4">
                        {selectedPayment === 'stripe' ? (
                          <Elements stripe={stripePromise} options={stripeClientSecret ? { clientSecret: stripeClientSecret } : {}}>
                            <CheckoutForm
                              onSuccess={handlePostPayment}
                              onError={(msg) => setPaymentError(msg)}
                              processing={processing}
                            />
                          </Elements>
                        ) : selectedPayment === 'paypal' ? (
                          <div className="space-y-4">
                            <div className="text-center">
                              <p className="text-lg font-semibold">€{selectedFeatureType ? FEATURE_PRICES[selectedFeatureType] : 0}</p>
                              <p className="text-sm text-muted-foreground">{selectedFeatureType === 'featured' ? 'Featured Listing Credit' : 'Standard Listing Credit'}</p>
                            </div>
                            <PayPalScriptProvider options={paypalOptions}>
                              <PayPalButtons
                                createOrder={createPayPalOrder}
                                onApprove={onPayPalApprove}
                                onError={onPayPalError}
                                style={{ layout: "vertical" }}
                              />
                            </PayPalScriptProvider>
                          </div>
                        ) : null}
                        {paymentError && <div className="text-red-500 text-sm mt-2">{paymentError}</div>}
                        <Button
                          variant="outline"
                          onClick={() => setPaymentStep('selectPayment')}
                          className="w-full"
                        >
                          Back
                        </Button>
                      </div>
                    )}
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={() => router.push('/events/host')}
                >
                  List your event
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add Credit cards for Events Listing section */}
            {userDoc && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Your Current Event Listing Credit</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      <span className="font-medium">Standard Listing</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {userDoc.standardListingRemaining || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      <span className="font-medium">Featured Listing</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {userDoc.featuredListingRemaining || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
 
            {/* Listings Grid */}
            {events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No event listings found</h3>
                <p className="text-muted-foreground mb-4">Start by creating your first event listing.</p>
                <Button onClick={() => router.push('/events/host')}>
                  Create First Event
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{event.eventName || 'Unnamed Event'}</CardTitle>
                          <CardDescription className="truncate">{event.location || 'Location TBD'}</CardDescription>
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
                                  col: "events",
                                  id: event.id,
                                  fieldName: "eventName",
                                  label: "Event Name",
                                  currentValue: event.eventName || "",
                                })
                              }
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/events/${event.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeactivate('events', event.id)}
                              disabled={event.deactivated}
                            >
                              Deactivate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const attendees = Array.isArray(event.attendees) ? event.attendees : [];
                                setAttendeesModal({ open: true, attendees });
                              }}
                            >
                              View Registrations
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Event Date:</span>
                          <span>{event.eventDate?.seconds 
                            ? new Date(event.eventDate.seconds * 1000).toLocaleDateString()
                            : event.eventDate?.toString() || 'TBD'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Location:</span>
                          <span className="truncate">{event.location || 'TBD'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Tag className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={event.status === 'approved' ? 'default' : 'secondary'}>
                            {event.status || 'Pending'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Star className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Featured:</span>
                          <Badge variant={event.featured ? 'default' : 'outline'}>
                            {event.featured ? 'Yes' : 'No'}
                          </Badge>
                        </div>

                        {event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Registrations:</span>
                            <Badge variant="outline">{event.attendees.length}</Badge>
                          </div>
                        )}

                        {event.deactivated && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="destructive">Deactivated</Badge>
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <Dialog open={advertiseModal?.open && advertiseModal.col === 'events' && advertiseModal.id === event.id} onOpenChange={(open) => {
                          if (!open) {
                            setAdvertiseModal(null);
                            setSelectedFeatureType(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant={event.featured ? "secondary" : "default"}
                              size="sm"
                              disabled={event.featured || event.deactivated}
                              className="w-full"
                              onClick={() => {
                                setAdvertiseModal({ open: true, col: 'events', id: event.id });
                                setSelectedFeatureType(null);
                              }}
                            >
                              {event.featured ? "Featured" : "Feature"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Feature Listing</DialogTitle>
                              <DialogDescription>
                                Choose a feature type for your listing.
                              </DialogDescription>
                            </DialogHeader>
                            
                            {/* Credit Cards */}
                            {userDoc && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium mb-2">Your Current Credit</h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 bg-muted rounded text-center">
                                    <p className="text-sm font-medium">Standard</p>
                                    <p className="text-lg font-bold text-primary">
                                      {userDoc.standardListingRemaining || 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Remaining</p>
                                  </div>
                                  <div className="p-3 bg-muted rounded text-center">
                                    <p className="text-sm font-medium">Featured</p>
                                    <p className="text-lg font-bold text-primary">
                                      {userDoc.featuredListingRemaining || 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Remaining</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Feature Type Selection */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <input 
                                  type="radio" 
                                  id="feature-standard" 
                                  name="feature-type" 
                                  value="standard" 
                                  checked={selectedFeatureType === 'standard'} 
                                  onChange={() => setSelectedFeatureType('standard')}
                                  disabled={!userDoc || userDoc.standardListingRemaining <= 0}
                                />
                                <Label htmlFor="feature-standard" className="flex-1">
                                  <div className="font-medium">Standard Listing</div>
                                  <div className="text-sm text-muted-foreground">
                                    Will display in the featured section for 1 month only
                                  </div>
                                </Label>
                              </div>
                              <div className="flex items-center gap-3">
                                <input 
                                  type="radio" 
                                  id="feature-featured" 
                                  name="feature-type" 
                                  value="featured" 
                                  checked={selectedFeatureType === 'featured'} 
                                  onChange={() => setSelectedFeatureType('featured')}
                                  disabled={!userDoc || userDoc.featuredListingRemaining <= 0}
                                />
                                <Label htmlFor="feature-featured" className="flex-1">
                                  <div className="font-medium">Featured (Premium) Listing</div>
                                  <div className="text-sm text-muted-foreground">
                                    Will stay in the featured section for 1 year and will have higher priority and more clicks
                                  </div>
                                </Label>
                              </div>
                            </div>
                            
                            <div className="py-4 text-center">
                              <Button
                                className="w-full text-lg py-4"
                                disabled={advertiseLoading || !selectedFeatureType}
                                onClick={() => handleAdvertise('events', event.id)}
                              >
                                {advertiseLoading ? "Processing..." : `Feature ${selectedFeatureType === 'standard' ? 'Standard' : 'Premium'}`}
                              </Button>
                            </div>
                            
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!attendeesModal?.open} onOpenChange={(o) => !o && setAttendeesModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Event Registrations</DialogTitle>
            <DialogDescription>People who registered for this event.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-auto">
            {attendeesModal?.attendees && attendeesModal.attendees.length > 0 ? (
              attendeesModal.attendees.map((a, i) => (
                <div key={i} className="flex items-center justify-between border rounded px-3 py-2">
                  <div className="text-sm">
                    <div className="font-medium">{a.email || a.uid || "Unknown"}</div>
                    {a.uid && <div className="text-xs text-muted-foreground">UID: {a.uid}</div>}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No registrations yet.</div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EventEditDialog
        open={!!editModal?.open}
        onOpenChange={(o) => {
          if (!o) setEditModal(null);
        }}
        documentId={editModal?.id || ""}
        initial={{
          eventName: events.find((e) => e.id === editModal?.id)?.eventName,
          location: events.find((e) => e.id === editModal?.id)?.location,
          description: events.find((e) => e.id === editModal?.id)?.description,
          organizerName: events.find((e) => e.id === editModal?.id)?.organizerName,
          organizerContact: events.find((e) => e.id === editModal?.id)?.organizerContact,
          eventType: events.find((e) => e.id === editModal?.id)?.eventType,
          vehicleFocus: events.find((e) => e.id === editModal?.id)?.vehicleFocus,
          expectedAttendance: events.find((e) => e.id === editModal?.id)?.expectedAttendance,
          entryFee: events.find((e) => e.id === editModal?.id)?.entryFee,
          scheduleHighlights: events.find((e) => e.id === editModal?.id)?.scheduleHighlights,
          activities: events.find((e) => e.id === editModal?.id)?.activities,
          rulesUrl: events.find((e) => e.id === editModal?.id)?.rulesUrl,
          sponsors: events.find((e) => e.id === editModal?.id)?.sponsors,
          websiteUrl: events.find((e) => e.id === editModal?.id)?.websiteUrl,
        }}
        onSaved={(update) => {
          setEvents((prev) => prev.map((e) => (e.id === editModal?.id ? { ...e, ...update } : e)));
        }}
      />
    </div>
  );
} 