"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Car, Star, Zap, Crown, Info, Settings } from "lucide-react";
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
import HowItWorksModal from "@/components/HowItWorksModal";

export default function OthersListingPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [advertiseModal, setAdvertiseModal] = useState<{ open: boolean; col: string; id: string } | null>(null);
  const [advertiseLoading, setAdvertiseLoading] = useState(false);
  const [selectedFeatureType, setSelectedFeatureType] = useState<'standard' | 'featured' | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  // Payment modal state
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; col: string; id: string } | null>(null);
  const [paymentStep, setPaymentStep] = useState<'selectType' | 'selectPayment' | 'pay'>('selectType');
  const [selectedPayment, setSelectedPayment] = useState<'stripe' | 'paypal' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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
              item.userId === currentUser.uid ||
              item.userEmail === currentUser.email
          );
      };
      
      // Fetch user document for services listings
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserDoc(userSnap.exists() ? userSnap.data() : null);
      
      const servicesData = await fetchByUser("others");
      setServices(servicesData);
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
        description: "Your service listing credit has been added to your account.",
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
              item.userId === currentUser.uid ||
              item.userEmail === currentUser.email
          );
      };
      setServices(await fetchByUser("others"));
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
              item.userId === currentUser.uid ||
              item.userEmail === currentUser.email
          );
      };
      setServices(await fetchByUser("others"));
      
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
      amount = FEATURE_PRICES[selectedFeatureType];
      description = selectedFeatureType === 'featured' ? 'Featured Listing' : 'Standard Listing';
    }
    if (!amount || !description) {
      setPaymentError('Invalid payment details.');
      setProcessing(false);
      return;
    }
    if (selectedPayment === 'stripe') {
      // Call API to create Stripe Checkout session
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
        setPaymentError(data.error || 'Failed to create Stripe Checkout session.');
      }
      setProcessing(false);
    } else if (selectedPayment === 'paypal') {
      // Call API to create PayPal order
      const res = await fetch('/api/payment/paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description }),
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
      amount = FEATURE_PRICES[selectedFeatureType];
      description = selectedFeatureType === 'featured' ? 'Featured Listing' : 'Standard Listing';
    }
    if (!amount || !description) {
      throw new Error('Invalid payment details');
    }
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

  const activeListingsCount = services.filter((s) => !s.deactivated).length;
  const activeAdsCount = services.filter((s) => s.featured && !s.deactivated).length;

  const tableData = {
    label: "Services Listing",
    data: services,
    columns: [
      { label: "Service Name", key: "serviceName" },
      { label: "Service Type", key: "serviceType" },
      { label: "Location", key: "location" },
      { label: "Status", key: "status" },
      { label: "Featured", key: "featured" },
      { label: "Deactivated", key: "deactivated" },
    ],
    col: "others",
    viewPath: "/others/",
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
    <div className="container mx-auto px-4 py-8">
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
                Service listing featured successfully! Your Credit has been updated.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold font-headline">Services Listing</h1>
          <p className="mt-2 text-muted-foreground">Welcome back, {getUserName()}!</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Active Listings</CardTitle>
            <CardDescription>All your service listings currently live.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{activeListingsCount}</p>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Featured Listings</CardTitle>
            <CardDescription>All your featured (advertised) service listings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{activeAdsCount}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12 text-lg animate-pulse">Loading your service listings...</div>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{tableData.label}</CardTitle>
                <CardDescription>Manage your {tableData.label.toLowerCase()} here.</CardDescription>
              </div>
              <div className="flex gap-2">
                <HowItWorksModal 
                  listingType="service"
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
                      onClick={() => {
                        setPaymentModal({ open: true, col: 'users', id: currentUser?.uid || '' });
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
                  onClick={() => router.push('/others/register')}
                >
                  List your service
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add Credit cards for Services Listing section */}
            {userDoc && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Your Current Listing Credit</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="w-full overflow-x-auto">
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow>
                    {tableData.columns.map((col) => (
                      <TableHead key={typeof col.key === "string" ? col.key : col.label} className="whitespace-nowrap px-2">{col.label}</TableHead>
                    ))}
                    <TableHead className="whitespace-nowrap px-2 w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={tableData.columns.length + 1} className="text-center text-muted-foreground">No service listings found.</TableCell>
                    </TableRow>
                  ) : (
                    tableData.data.map((item: any) => (
                      <TableRow key={item.id}>
                        {tableData.columns.map((col, idx) => (
                          <TableCell key={idx} className="whitespace-nowrap px-2">
                            {typeof col.key === "function"
                              ? (col.key as Function)(item)
                              : col.key === "deactivated"
                              ? item.deactivated ? "Yes" : "No"
                              : col.key === "featured"
                              ? item.featured ? "Yes" : "No"
                              : col.key === "type"
                              ? item.type || "N/A"
                              : col.key === "serviceName"
                              ? item.serviceName || "-"
                              : col.key === "serviceType"
                              ? item.serviceType || "-"
                              : item[col.key] || "-"}
                          </TableCell>
                        ))}
                        <TableCell className="flex gap-2 whitespace-nowrap px-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">Actions</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem asChild>
                                <Link href={tableData.viewPath + item.id}>View</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeactivate(tableData.col, item.id)}
                                disabled={item.deactivated}
                              >
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Dialog open={advertiseModal?.open && advertiseModal.col === tableData.col && advertiseModal.id === item.id} onOpenChange={(open) => {
                            if (!open) {
                              setAdvertiseModal(null);
                              setSelectedFeatureType(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant={item.featured ? "secondary" : "default"}
                                size="sm"
                                disabled={item.featured}
                                onClick={() => {
                                  setAdvertiseModal({ open: true, col: tableData.col, id: item.id });
                                  setSelectedFeatureType(null);
                                }}
                              >
                                {item.featured ? "Featured" : "Feature"}
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
                                  onClick={() => handleAdvertise(tableData.col, item.id)}
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 