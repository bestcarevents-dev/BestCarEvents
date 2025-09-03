"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { loadStripe } from "@stripe/stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Elements } from '@stripe/react-stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useToast } from "@/hooks/use-toast";
import { usePricing } from "@/lib/usePricing";
import { validateCoupon } from "@/lib/coupon";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PAGE_OPTIONS = [
  "Events",
  "Cars for sale",
  "Auctions",
  "Car Hotels",
  "Car clubs"
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
  const anyNeedsType = ads.some((a) => !a.bannerType);
  
  // Payment modal state
  const [bannerPaymentModal, setBannerPaymentModal] = useState<{ open: boolean; type: 'homepage' | 'category' | null }>({ open: false, type: null });
  const [bannerPaymentStep, setBannerPaymentStep] = useState<'selectPayment' | 'pay'>('selectPayment');
  const [bannerSelectedPayment, setBannerSelectedPayment] = useState<'stripe' | 'paypal' | null>(null);
  const [bannerProcessing, setBannerProcessing] = useState(false);
  const [bannerStripeClientSecret, setBannerStripeClientSecret] = useState<string | null>(null);
  const [bannerPaymentError, setBannerPaymentError] = useState<string | null>(null);
  // Pending selection that triggered a purchase flow
  const [pendingBannerSelection, setPendingBannerSelection] = useState<{ adId: string; adType: 'homepage' | 'category' } | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponInfo, setCouponInfo] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  // Dynamic pricing
  const { get: getPrice } = usePricing();

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
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const getTime = (ad: any) => {
        const candidates = [ad.submittedAt, ad.createdAt, ad.uploadedAt, ad.created, ad.timestamp, ad.updatedAt];
        for (const t of candidates) {
          if (!t) continue;
          if (typeof t === 'number') return t;
          if (t?.seconds) return t.seconds * 1000 + (t.nanoseconds ? Math.floor(t.nanoseconds / 1e6) : 0);
          const d = new Date(t);
          if (!isNaN(d.getTime())) return d.getTime();
        }
        // Fallback: sort by id string (not perfect but stable)
        return 0;
      };
      items.sort((a, b) => getTime(b) - getTime(a));
      setAds(items);
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

  // Credit validation function
  const validateCredits = (adType: 'homepage' | 'category') => {
    if (!userDoc) return false;
    
    if (adType === 'homepage') {
      return (userDoc.homepageBannerRemaining || 0) > 0;
    } else {
      return (userDoc.categoryBannerRemaining || 0) > 0;
    }
  };

  // Ad validation function (accept multiple shapes)
  const validateAd = (ad: any) => {
    const hasTitle = Boolean(
      ad.title ||
      ad.productName ||
      ad.type ||
      ad.shopName ||
      ad.providerName ||
      ad.experienceName ||
      ad.serviceName ||
      ad.websiteName ||
      ad.businessName
    );
    const hasDescription = Boolean(ad.description);
    const hasImages = Array.isArray(ad.imageUrls) && ad.imageUrls.length > 0;
    const hasAdType = Boolean(ad.adType || ad.type);
    return hasTitle && hasDescription && hasImages && hasAdType;
  };

  // Handle ad type selection
  const handleAdTypeSelection = async (ad: any, adType: 'homepage' | 'category') => {
    if (!validateAd(ad)) {
      toast({
        title: "Ad Validation Failed",
        description: "Please ensure your ad has a title, description, ad type, and at least one image.",
        variant: "destructive",
      });
      return;
    }
    
    if (!validateCredits(adType)) {
      // Open purchase modal for the selected type and remember pending selection
      setPendingBannerSelection({ adId: ad.id, adType });
      setBannerPaymentModal({ open: true, type: adType });
      setBannerSelectedPayment(null);
      setBannerPaymentStep('selectPayment');
      setBannerStripeClientSecret(null);
      setBannerPaymentError(null);
      return;
    }
    
    try {
      const db = getFirestore(app);
      
      // Update the ad with banner type and isHomepage
      await updateDoc(doc(db, "partnerAds", ad.id), { 
        bannerType: adType,
        isHomepage: adType === 'homepage'
      });
      
      // Decrease the user's credits
      if (adType === 'homepage') {
        await updateDoc(doc(db, "users", currentUser!.uid), {
          homepageBannerRemaining: (userDoc?.homepageBannerRemaining || 0) - 1
        });
        setUserDoc((prev: any) => prev ? {
          ...prev,
          homepageBannerRemaining: (prev.homepageBannerRemaining || 0) - 1
        } : null);
      } else {
        await updateDoc(doc(db, "users", currentUser!.uid), {
          categoryBannerRemaining: (userDoc?.categoryBannerRemaining || 0) - 1
        });
        setUserDoc((prev: any) => prev ? {
          ...prev,
          categoryBannerRemaining: (prev.categoryBannerRemaining || 0) - 1
        } : null);
      }
      
      // Update local state
      setAds(prev => prev.map(a => a.id === ad.id ? { 
        ...a, 
        bannerType: adType,
        isHomepage: adType === 'homepage'
      } : a));
      
      toast({
        title: "Ad Type Selected",
        description: `${adType === 'homepage' ? 'Homepage' : 'Category'} Banner Ad type has been set for this ad.`,
      });
    } catch (error) {
      console.error('Error updating ad type:', error);
      toast({
        title: "Error",
        description: "Failed to update ad type. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Payment handlers
  const handleBannerPayment = async () => {
    setBannerProcessing(true);
    setBannerPaymentError(null);
    let amount = 0;
    let description = '';
    if (bannerPaymentModal.type === 'homepage') {
      amount = getPrice('banner.homepage', BANNER_PRICES.homepage);
      description = 'Homepage Banner (All Pages + Category)';
    } else if (bannerPaymentModal.type === 'category') {
      amount = getPrice('banner.category', BANNER_PRICES.category);
      description = 'Category Page Banner';
    }
    if (!amount || !description) {
      setBannerPaymentError('Invalid payment details.');
      setBannerProcessing(false);
      return;
    }
    const finalAmount = Math.max(0, amount - (couponDiscount || 0));
    if (bannerSelectedPayment === 'stripe') {
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
          category: 'banner'
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
        body: JSON.stringify({ amount: finalAmount, description, couponCode: couponCode || undefined, category: 'banner' }),
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
      amount = getPrice('banner.homepage', BANNER_PRICES.homepage);
      description = 'Homepage Banner (All Pages + Category)';
    } else if (bannerPaymentModal.type === 'category') {
      amount = getPrice('banner.category', BANNER_PRICES.category);
      description = 'Category Page Banner';
    }
    if (!amount || !description) {
      throw new Error('Invalid payment details');
    }
    const res = await fetch('/api/payment/paypal-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.max(0, amount - (couponDiscount || 0)), description, couponCode: couponCode || undefined, category: 'banner' }),
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
    // If user initiated a selection that required purchase, apply it now
    if (pendingBannerSelection && bannerPaymentModal.type === pendingBannerSelection.adType) {
      const targetAd = ads.find(a => a.id === pendingBannerSelection.adId);
      if (targetAd) {
        try {
          await handleAdTypeSelection(targetAd, pendingBannerSelection.adType);
        } catch (e) {
          // Error toasts are handled inside handleAdTypeSelection
        }
      }
      setPendingBannerSelection(null);
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
        {/* Strong guidance callout */}
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-4">
          <div className="font-semibold mb-1">Important</div>
          <p className="text-sm">
            Please choose an Ad Type for any ad you just submitted. Your ad will not be shown until you select an Ad Type. 
            When you select an Ad Type, one credit of that type will be used.
          </p>
        </div>
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
                          <div className="flex items-center gap-2">
                            <Input placeholder="Coupon code (optional)" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                            <Button
                              variant="outline"
                              onClick={async () => {
                                let amt = 0;
                                if (bannerPaymentModal.type === 'homepage') amt = getPrice('banner.homepage', BANNER_PRICES.homepage);
                                if (bannerPaymentModal.type === 'category') amt = getPrice('banner.category', BANNER_PRICES.category);
                                if (!couponCode || !amt) { setCouponInfo(''); setCouponDiscount(0); return; }
                                const res = await validateCoupon(couponCode, 'banner', amt);
                                if (res.valid) {
                                  setCouponDiscount(res.discount || 0);
                                  setCouponInfo(`Coupon applied: -€${(res.discount || 0).toFixed(2)}`);
                                } else {
                                  setCouponDiscount(0);
                                  setCouponInfo(res.reason || 'Coupon not valid');
                                }
                              }}
                            >Apply</Button>
                          </div>
                          {couponInfo && <div className="text-sm text-muted-foreground">{couponInfo}</div>}
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
                              <p className="text-lg font-semibold">€{(() => {
                                const base = bannerPaymentModal.type === 'homepage' ? getPrice('banner.homepage', BANNER_PRICES.homepage) : getPrice('banner.category', BANNER_PRICES.category);
                                return Math.max(0, base - (couponDiscount || 0));
                              })()}</p>
                              <p className="text-sm text-muted-foreground">Category Page Banner Advertisement</p>
                              <p className="text-sm text-muted-foreground mt-2">Redirecting to Stripe Checkout...</p>
                            </div>
                          ) : bannerSelectedPayment === 'paypal' ? (
                            <div className="space-y-4">
                              <div className="text-center">
                                <p className="text-lg font-semibold">€{(() => {
                                  const base = bannerPaymentModal.type === 'homepage' ? getPrice('banner.homepage', BANNER_PRICES.homepage) : getPrice('banner.category', BANNER_PRICES.category);
                                  return Math.max(0, base - (couponDiscount || 0));
                                })()}</p>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Ads</h2>
            <Button 
              onClick={() => router.push('/advertise/advertise')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Create New Ad
            </Button>
          </div>
          {anyNeedsType && (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-3">
              <span className="font-semibold">Important:</span> One or more of your ads requires an Ad Type. Until an Ad Type is selected, the ad will not be displayed. Please select an Ad Type and then choose the pages where it should appear.
            </div>
          )}
          {adsLoading ? (
            <div className="text-center py-8 animate-pulse">Loading your ads...</div>
          ) : ads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">You have not created any ads yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map(ad => {
                const needsType = !ad.bannerType;
                return (
                <div key={ad.id} className={`bg-card border rounded-xl p-4 shadow hover:shadow-lg transition group flex flex-col gap-4 ${needsType ? 'border-amber-400 ring-1 ring-amber-300 bg-amber-50/40' : ''}`}>
                  {needsType && (
                    <div className="text-xs text-amber-900 bg-amber-100 border border-amber-200 rounded px-2 py-1">
                      This ad needs an Ad Type to be selected. It will not be shown until you choose one. Selecting an Ad Type will use 1 credit of that type.
                    </div>
                  )}
                  <div onClick={() => router.push(`/partners/ad/${ad.id}`)} className="cursor-pointer">
                    <h3 className="text-lg font-bold mb-2">{ad.title || ad.productName || ad.type}</h3>
                    <div className="text-sm text-muted-foreground mb-2">{ad.adType || ad.type}</div>
                    <div className="text-sm line-clamp-2 mb-2">{ad.description}</div>
                    {ad.imageUrls && ad.imageUrls.length > 0 && (
                      <img src={ad.imageUrls[0]} alt="Ad" className="w-full h-40 object-contain bg-muted rounded mt-2" />
                    )}
                  </div>
                  
                  {/* Ad Type Selection */}
                  <div className="mt-2">
                    <label className="block text-xs font-semibold mb-1">Choose Ad Type:</label>
                    {!ad.bannerType ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-3 py-1 h-auto disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto whitespace-normal break-words text-left max-w-full"
                            disabled={!validateAd(ad)}
                            onClick={async () => {
                              if (validateCredits('category')) {
                                await handleAdTypeSelection(ad, 'category');
                              } else {
                                setPendingBannerSelection({ adId: ad.id, adType: 'category' });
                                setBannerPaymentModal({ open: true, type: 'category' });
                                setBannerSelectedPayment(null);
                                setBannerPaymentStep('selectPayment');
                                setBannerStripeClientSecret(null);
                                setBannerPaymentError(null);
                              }
                            }}
                          >
                            {`Category Banner Ad (${userDoc?.categoryBannerRemaining ?? 0})`}
                          </Button>
                          <Button
                            type="button"
                            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-3 py-1 h-auto disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto whitespace-normal break-words text-left max-w-full"
                            disabled={!validateAd(ad)}
                            onClick={async () => {
                              if (validateCredits('homepage')) {
                                await handleAdTypeSelection(ad, 'homepage');
                              } else {
                                setPendingBannerSelection({ adId: ad.id, adType: 'homepage' });
                                setBannerPaymentModal({ open: true, type: 'homepage' });
                                setBannerSelectedPayment(null);
                                setBannerPaymentStep('selectPayment');
                                setBannerStripeClientSecret(null);
                                setBannerPaymentError(null);
                              }
                            }}
                          >
                            {`Homepage Banner Ad (${userDoc?.homepageBannerRemaining ?? 0})`}
                          </Button>
                        </div>
                        <div className="text-[11px] text-muted-foreground">Note: Choosing an Ad Type will consume 1 credit of that type.</div>
                        {!validateAd(ad) && (
                          <div className="flex items-center gap-2 text-xs text-red mt-2 bg-destructive/10 rounded px-2 py-1">
                            <AlertTriangle className="w-4 h-4" /> Ad validation failed - missing required fields
                          </div>
                        )}
                        {validateAd(ad) && !validateCredits('category') && !validateCredits('homepage') && (
                          <div className="flex items-center gap-2 text-xs text-red mt-2 bg-destructive/10 rounded px-2 py-1">
                            <AlertTriangle className="w-4 h-4" /> Insufficient credits - please purchase more banner credits
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-medium">
                          {ad.bannerType === 'homepage' ? 'Homepage Banner Ad' : 'Category Banner Ad'}
                        </span>
                        {ad.bannerType === 'homepage' && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Also showing on homepage
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Show this ad on - only show if ad type is selected */}
                  {ad.bannerType && (
                    <div className="mt-2">
                      <label className="block text-xs font-semibold mb-1">Show this ad on category:</label>
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
                        <div className="flex items-center gap-2 text-xs text-red mt-2 bg-destructive/10 rounded px-2 py-1">
                          <AlertTriangle className="w-4 h-4" /> No page selected
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );})}
            </div>
          )}
        </div>
      </div>
    </PayPalScriptProvider>
  );
} 