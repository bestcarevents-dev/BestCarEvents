"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { AlertTriangle, Info } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { loadStripe } from "@stripe/stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Elements } from '@stripe/react-stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useToast } from "@/hooks/use-toast";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PAGE_OPTIONS = [
  "Events",
  "Cars for sale",
  "Auctions",
  "Car Hotels",
  "Car clubs",
  "Home page"
];

const BANNER_PRICES = {
  homepage: 6000, // EUR
  category: 2500, // EUR
};

// PayPal configuration
const paypalOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "AW2LLf5-BoTh1ZUKUhs8Ic7nmIfH49BV92y-960SIzcvrO4vlDpLtNKe--xYpNB9Yb3xn7XONXJbErNv",
  currency: "EUR",
  intent: "capture",
};

export default function MyAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userDoc, setUserDoc] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();
  
  // Payment modal state
  const [bannerPaymentModal, setBannerPaymentModal] = useState<{ open: boolean; type: 'homepage' | 'category' | null }>({ open: false, type: null });
  const [bannerPaymentStep, setBannerPaymentStep] = useState<'selectPayment' | 'pay'>('selectPayment');
  const [bannerSelectedPayment, setBannerSelectedPayment] = useState<'stripe' | 'paypal' | null>(null);
  const [bannerProcessing, setBannerProcessing] = useState(false);
  const [bannerStripeClientSecret, setBannerStripeClientSecret] = useState<string | null>(null);
  const [bannerPaymentError, setBannerPaymentError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authChecked || !currentUser) return;
    const fetchAds = async () => {
      setAdsLoading(true);
      const db = getFirestore(app);
      
      // Fetch user document for banner remaining counts
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserDoc(userSnap.exists() ? userSnap.data() : null);
      
      const adsQuery = query(collection(db, "partnerAds"), where("uploadedByUserId", "==", currentUser.uid));
      const snapshot = await getDocs(adsQuery);
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setAdsLoading(false);
    };
    fetchAds();
  }, [currentUser, authChecked]);

  // Handle success/cancel from Stripe checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === '1') {
      toast({
        title: "Payment Successful!",
        description: "Your banner advertisement credit has been added to your account.",
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

  // Payment handlers
  const handleBannerPayment = async () => {
    setBannerProcessing(true);
    setBannerPaymentError(null);
    let amount = 0;
    let description = '';
    if (bannerPaymentModal.type === 'homepage') {
      amount = BANNER_PRICES.homepage;
      description = 'Homepage Banner Advertisement';
    } else if (bannerPaymentModal.type === 'category') {
      amount = BANNER_PRICES.category;
      description = 'Category Page Banner Advertisement';
    }
    if (!amount || !description) {
      setBannerPaymentError('Invalid payment details.');
      setBannerProcessing(false);
      return;
    }
    if (bannerSelectedPayment === 'stripe') {
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
        setBannerPaymentError(data.error || 'Failed to create Stripe Checkout session.');
      }
      setBannerProcessing(false);
    } else if (bannerSelectedPayment === 'paypal') {
      // Call API to create PayPal order
      const res = await fetch('/api/payment/paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description }),
      });
      const data = await res.json();
      if (data.orderId) {
        setBannerPaymentStep('pay');
      } else {
        setBannerPaymentError(data.error || 'Failed to create PayPal order.');
      }
      setBannerProcessing(false);
    }
  };

  // PayPal handlers
  const createBannerPayPalOrder = async (data: any, actions: any) => {
    let amount = 0;
    let description = '';
    if (bannerPaymentModal.type === 'homepage') {
      amount = BANNER_PRICES.homepage;
      description = 'Homepage Banner Advertisement';
    } else if (bannerPaymentModal.type === 'category') {
      amount = BANNER_PRICES.category;
      description = 'Category Page Banner Advertisement';
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

  const onBannerPayPalApprove = async (data: any, actions: any) => {
    try {
      const res = await fetch('/api/payment/paypal-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderID }),
      });
      const captureData = await res.json();
      if (captureData.success) {
        await handleBannerPostPayment();
        return Promise.resolve();
      } else {
        throw new Error(captureData.error || 'Payment capture failed');
      }
    } catch (error: any) {
      setBannerPaymentError(error.message || 'Payment failed');
      return Promise.reject(error);
    }
  };

  const onBannerPayPalError = (err: any) => {
    setBannerPaymentError('PayPal error: ' + (err?.message || 'Unknown error'));
  };

  // Stripe CheckoutForm
  function BannerCheckoutForm({ onSuccess, onError, processing }: { onSuccess: () => void, onError: (msg: string) => void, processing: boolean }) {
    const stripe = useStripe();
    const elements = useElements();
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;
      const card = elements.getElement(CardElement);
      if (!card) return;
      const { error, paymentIntent } = await stripe.confirmCardPayment(bannerStripeClientSecret!, {
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
  const handleBannerPostPayment = async () => {
    if (!bannerPaymentModal.type) return;
    const db = getFirestore(app);
    // Increment the user's Credit
    if (bannerPaymentModal.type === 'homepage') {
      await updateDoc(doc(db, "users", currentUser!.uid), {
        homepageBannerRemaining: (userDoc?.homepageBannerRemaining || 0) + 1
      });
      setUserDoc((prev: any) => prev ? {
        ...prev,
        homepageBannerRemaining: (prev.homepageBannerRemaining || 0) + 1
      } : null);
    } else {
      await updateDoc(doc(db, "users", currentUser!.uid), {
        categoryBannerRemaining: (userDoc?.categoryBannerRemaining || 0) + 1
      });
      setUserDoc((prev: any) => prev ? {
        ...prev,
        categoryBannerRemaining: (prev.categoryBannerRemaining || 0) + 1
      } : null);
    }
    setBannerPaymentModal({ open: false, type: null });
    setBannerSelectedPayment(null);
    setBannerPaymentStep('selectPayment');
    setBannerStripeClientSecret(null);
    toast({
      title: "Payment Successful",
      description: `You have purchased 1 ${bannerPaymentModal.type === 'homepage' ? 'Homepage' : 'Category'} Banner Credit!`,
    });
    // Refresh user document
    if (currentUser) {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserDoc(userSnap.exists() ? userSnap.data() : null);
    }
  };

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <div className="container mx-auto px-4 py-12">
        {/* Banner Remaining Cards */}
        {userDoc && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Your Banner Advertisement Credit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">Category Page Banner</h3>
                  </div>
                  <Dialog open={bannerPaymentModal.open && bannerPaymentModal.type === 'category'} onOpenChange={(open) => {
                    if (!open) {
                      setBannerPaymentModal({ open: false, type: null });
                      setBannerSelectedPayment(null);
                      setBannerPaymentStep('selectPayment');
                      setBannerStripeClientSecret(null);
                      setBannerPaymentError(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setBannerPaymentModal({ open: true, type: 'category' });
                          setBannerSelectedPayment(null);
                          setBannerPaymentStep('selectPayment');
                          setBannerStripeClientSecret(null);
                          setBannerPaymentError(null);
                        }}
                      >
                        Buy More
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Buy Category Page Banner Credit</DialogTitle>
                        <DialogDescription>
                          {bannerPaymentStep === 'selectPayment' && 'Choose a payment method to continue.'}
                          {bannerPaymentStep === 'pay' && bannerSelectedPayment === 'stripe' && 'Pay securely with your card.'}
                          {bannerPaymentStep === 'pay' && bannerSelectedPayment === 'paypal' && 'Pay securely with PayPal.'}
                        </DialogDescription>
                      </DialogHeader>
                      
                      {bannerPaymentStep === 'selectPayment' && (
                        <div className="flex flex-col gap-4 py-4">
                          <div className="flex items-center gap-4">
                            <input
                              type="radio"
                              id="pay-stripe-category"
                              name="payment-method-category"
                              value="stripe"
                              checked={bannerSelectedPayment === 'stripe'}
                              onChange={() => setBannerSelectedPayment('stripe')}
                            />
                            <Label htmlFor="pay-stripe-category">Pay with Card (Stripe)</Label>
                          </div>
                          <div className="flex items-center gap-4">
                            <input
                              type="radio"
                              id="pay-paypal-category"
                              name="payment-method-category"
                              value="paypal"
                              checked={bannerSelectedPayment === 'paypal'}
                              onChange={() => setBannerSelectedPayment('paypal')}
                            />
                            <Label htmlFor="pay-paypal-category">Pay with PayPal</Label>
                          </div>
                          <Button
                            className="w-full mt-4"
                            onClick={async () => {
                              if (!bannerSelectedPayment) {
                                setBannerPaymentError('Please select a payment method.');
                                return;
                              }
                              await handleBannerPayment();
                            }}
                            disabled={bannerProcessing}
                          >
                            Continue
                          </Button>
                          {bannerPaymentError && <div className="text-red-500 text-sm mt-2">{bannerPaymentError}</div>}
                        </div>
                      )}
                      
                      {bannerPaymentStep === 'pay' && (
                        <div className="flex flex-col gap-4 py-4">
                          {bannerSelectedPayment === 'stripe' ? (
                            <div className="text-center">
                              <p className="text-lg font-semibold">€{BANNER_PRICES.category}</p>
                              <p className="text-sm text-muted-foreground">Category Page Banner Advertisement</p>
                              <p className="text-sm text-muted-foreground mt-2">Redirecting to Stripe Checkout...</p>
                            </div>
                          ) : bannerSelectedPayment === 'paypal' ? (
                            <div className="space-y-4">
                              <div className="text-center">
                                <p className="text-lg font-semibold">€{BANNER_PRICES.category}</p>
                                <p className="text-sm text-muted-foreground">Category Page Banner Advertisement</p>
                              </div>
                              <PayPalButtons
                                createOrder={createBannerPayPalOrder}
                                onApprove={onBannerPayPalApprove}
                                onError={onBannerPayPalError}
                                style={{ layout: "vertical" }}
                              />
                            </div>
                          ) : null}
                          {bannerPaymentError && <div className="text-red-500 text-sm mt-2">{bannerPaymentError}</div>}
                          <Button
                            variant="outline"
                            onClick={() => setBannerPaymentStep('selectPayment')}
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
                </div>
                <div className="text-center mb-3">
                  <p className="text-2xl font-bold text-primary">
                    {userDoc.categoryBannerRemaining || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Category page banners only allow your ad to be shown in a specific category page. 
                  This provides targeted exposure to users browsing that particular category.
                </p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">Homepage Banner</h3>
                  </div>
                  <Dialog open={bannerPaymentModal.open && bannerPaymentModal.type === 'homepage'} onOpenChange={(open) => {
                    if (!open) {
                      setBannerPaymentModal({ open: false, type: null });
                      setBannerSelectedPayment(null);
                      setBannerPaymentStep('selectPayment');
                      setBannerStripeClientSecret(null);
                      setBannerPaymentError(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setBannerPaymentModal({ open: true, type: 'homepage' });
                          setBannerSelectedPayment(null);
                          setBannerPaymentStep('selectPayment');
                          setBannerStripeClientSecret(null);
                          setBannerPaymentError(null);
                        }}
                      >
                        Buy More
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Buy Homepage Banner Credit</DialogTitle>
                        <DialogDescription>
                          {bannerPaymentStep === 'selectPayment' && 'Choose a payment method to continue.'}
                          {bannerPaymentStep === 'pay' && bannerSelectedPayment === 'stripe' && 'Pay securely with your card.'}
                          {bannerPaymentStep === 'pay' && bannerSelectedPayment === 'paypal' && 'Pay securely with PayPal.'}
                        </DialogDescription>
                      </DialogHeader>
                      
                      {bannerPaymentStep === 'selectPayment' && (
                        <div className="flex flex-col gap-4 py-4">
                          <div className="flex items-center gap-4">
                            <input
                              type="radio"
                              id="pay-stripe-homepage"
                              name="payment-method-homepage"
                              value="stripe"
                              checked={bannerSelectedPayment === 'stripe'}
                              onChange={() => setBannerSelectedPayment('stripe')}
                            />
                            <Label htmlFor="pay-stripe-homepage">Pay with Card (Stripe)</Label>
                          </div>
                          <div className="flex items-center gap-4">
                            <input
                              type="radio"
                              id="pay-paypal-homepage"
                              name="payment-method-homepage"
                              value="paypal"
                              checked={bannerSelectedPayment === 'paypal'}
                              onChange={() => setBannerSelectedPayment('paypal')}
                            />
                            <Label htmlFor="pay-paypal-homepage">Pay with PayPal</Label>
                          </div>
                          <Button
                            className="w-full mt-4"
                            onClick={async () => {
                              if (!bannerSelectedPayment) {
                                setBannerPaymentError('Please select a payment method.');
                                return;
                              }
                              await handleBannerPayment();
                            }}
                            disabled={bannerProcessing}
                          >
                            Continue
                          </Button>
                          {bannerPaymentError && <div className="text-red-500 text-sm mt-2">{bannerPaymentError}</div>}
                        </div>
                      )}
                      
                      {bannerPaymentStep === 'pay' && (
                        <div className="flex flex-col gap-4 py-4">
                          {bannerSelectedPayment === 'stripe' ? (
                            <div className="text-center">
                              <p className="text-lg font-semibold">€{BANNER_PRICES.homepage}</p>
                              <p className="text-sm text-muted-foreground">Homepage Banner Advertisement</p>
                              <p className="text-sm text-muted-foreground mt-2">Redirecting to Stripe Checkout...</p>
                            </div>
                          ) : bannerSelectedPayment === 'paypal' ? (
                            <div className="space-y-4">
                              <div className="text-center">
                                <p className="text-lg font-semibold">€{BANNER_PRICES.homepage}</p>
                                <p className="text-sm text-muted-foreground">Homepage Banner Advertisement</p>
                              </div>
                              <PayPalButtons
                                createOrder={createBannerPayPalOrder}
                                onApprove={onBannerPayPalApprove}
                                onError={onBannerPayPalError}
                                style={{ layout: "vertical" }}
                              />
                            </div>
                          ) : null}
                          {bannerPaymentError && <div className="text-red-500 text-sm mt-2">{bannerPaymentError}</div>}
                          <Button
                            variant="outline"
                            onClick={() => setBannerPaymentStep('selectPayment')}
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
                </div>
                <div className="text-center mb-3">
                  <p className="text-2xl font-bold text-primary">
                    {userDoc.homepageBannerRemaining || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Homepage banner remaining allows your ad to be seen on the homepage along with category pages. 
                  This provides maximum exposure across the entire website.
                </p>
              </Card>
            </div>
          </div>
        )}

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Your Ads</h2>
          {adsLoading ? (
            <div className="text-center py-8 animate-pulse">Loading your ads...</div>
          ) : ads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">You have not created any ads yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map(ad => (
                <div key={ad.id} className="bg-card border rounded-xl p-4 shadow hover:shadow-lg transition group flex flex-col gap-4">
                  <div onClick={() => router.push(`/partners/ad/${ad.id}`)} className="cursor-pointer">
                    <h3 className="text-lg font-bold mb-2">{ad.title || ad.productName || ad.type}</h3>
                    <div className="text-sm text-muted-foreground mb-2">{ad.adType || ad.type}</div>
                    <div className="text-sm line-clamp-2 mb-2">{ad.description}</div>
                    {ad.imageUrls && ad.imageUrls.length > 0 && (
                      <img src={ad.imageUrls[0]} alt="Ad" className="w-full h-32 object-cover rounded mt-2" />
                    )}
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs font-semibold mb-1">Show this ad on:</label>
                    <Select
                      value={ad.page || ""}
                      onValueChange={async (newPage) => {
                        const db = getFirestore(app);
                        await updateDoc(doc(db, "partnerAds", ad.id), { page: newPage });
                        setAds(prev => prev.map(a => a.id === ad.id ? { ...a, page: newPage } : a));
                      }}
                    >
                      <SelectTrigger className="w-full bg-background border-muted">
                        <SelectValue placeholder="-- Select Page --" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_OPTIONS.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!ad.page && (
                      <div className="flex items-center gap-2 text-xs text-destructive mt-2 bg-destructive/10 rounded px-2 py-1">
                        <AlertTriangle className="w-4 h-4" /> No page selected
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PayPalScriptProvider>
  );
} 