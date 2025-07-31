"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
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

const AD_CATEGORIES = [
  {
    title: "Banner Advertisement",
    subcategories: [
      { name: "Homepage Banner (All Pages + Category)", key: "homepageBannerRemaining", chfPrice: "CHF 5'600", eurPrice: "EUR 6'000" },
      { name: "Category Page Banner", key: "categoryBannerRemaining", chfPrice: "CHF 2'300", eurPrice: "EUR 2'500" },
    ],
  },
  {
    title: "Featured Listing",
    subcategories: [
      { name: "Featured Listing", key: "featuredListingRemaining", chfPrice: "CHF 4'400", eurPrice: "EUR 4'800" },
      { name: "Standard Listing", key: "standardListingRemaining", chfPrice: "CHF 370", eurPrice: "EUR 400" },
    ],
  },
  {
    title: "Newsletter Mentions",
    subcategories: [
      { name: "Premium Mention", key: "premiumNewsletterRemaining", chfPrice: "CHF 550", eurPrice: "EUR 600", suffix: " per mention per month" },
      { name: "Standard Mention", key: "standardNewsletterRemaining", chfPrice: "CHF 370", eurPrice: "EUR 400", suffix: " per mention per month" },
    ],
  },
];

// Add info content for each subcategory
const SUBCATEGORY_INFO: Record<string, string> = {
  "Homepage Banner (All Pages + Category)": `Homepage banner will be exposed on every side of the website plus in your category.\nDuration: 1 year\nPrice: CHF 5'600 / EUR 6'000`,
  "Category Page Banner": `Event/Club/Hotel/Auction page banner only on the page of your category.\nDuration: 1 year\nPrice: CHF 2'300 / EUR 2'500`,
  "Featured Listing": `Featured listing, only one or two per category. Photos will be exposed in the slideshow on the website, under their category and on the home site.\nDuration: 1 year\nPrice: CHF 4'400 / EUR 4'800`,
  "Standard Listing": `Standard listing.\nDuration: 1 month\nPrice: CHF 370 / EUR 400`,
  "Premium Mention": `Premium mention in newsletter (2 newsletters per month for 12 months a year). Includes a dedicated section with images (up to 4 images), description and a link to your website.\nPrice: CHF 550 / EUR 600 per mention per month`,
  "Standard Mention": `Standard mention in newsletter. Includes a brief mention with one image and a link to your website.\nPrice: CHF 370 / EUR 400 per mention per month`,
};

// Add Gold and Silver packages
const DASHBOARD_PACKAGES = [
  {
    name: "Gold Package",
    chfPrice: "CHF 14'000",
    eurPrice: "EUR 15'300",
    oldChfPrice: "CHF 16'500",
    oldEurPrice: "EUR 18'000",
    perMonthChf: "CHF 1'167",
    perMonthEur: "EUR 1'275",
    savings: "save over 15%",
    features: [
      "Homepage banner on every side, plus your category (worth CHF 5'600 / EUR 6'000) and on the newsletter for 1 year",
      "Featured listing for 1 year (worth CHF 4'400 / EUR 4'800)",
      "Premium mention in newsletter 4 times per month for 12 months (worth CHF 6'600 / EUR 7'200)"
    ]
  },
  {
    name: "Silver Package",
    chfPrice: "CHF 9'900",
    eurPrice: "EUR 10'800",
    oldChfPrice: "CHF 11'100",
    oldEurPrice: "EUR 12'100",
    perMonthChf: "CHF 825",
    perMonthEur: "EUR 900",
    savings: "save over 10%",
    features: [
      "Category page banner for 1 year (worth CHF 2'300 / EUR 2'500)",
      "Standard listing for 1 year (worth CHF 4'400 / EUR 4'800)",
      "Standard mention in newsletter 4 times per month for 12 months (worth CHF 4'400 / EUR 4'800)"
    ]
  }
];

// Helper to get numeric price in EUR from string
const getPriceEUR = (price: string) => {
  const match = price.replace(/'/g, "'").match(/([\d']+)/);
  if (!match) return 0;
  return parseInt(match[1].replace(/'/g, ''));
};

// Helper to format price display
const formatPriceDisplay = (chfPrice: string, eurPrice: string, suffix?: string) => {
  return (
    <div className="flex flex-col">
      <span className="font-semibold text-primary">{chfPrice}</span>
      <span className="text-sm text-muted-foreground">{eurPrice}</span>
      {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
    </div>
  );
};

// PayPal configuration
const paypalOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "AW2LLf5-BoTh1ZUKUhs8Ic7nmIfH49BV92y-960SIzcvrO4vlDpLtNKe--xYpNB9Yb3xn7XONXJbErNv",
  currency: "EUR",
  intent: "capture",
};

export default function PartnerDashboard() {
  const [userDoc, setUserDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const [paymentModal, setPaymentModal] = useState<{ open: boolean, type: 'category' | 'package', key?: string, name?: string, amount?: number } | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'stripe' | 'paypal' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'select' | 'pay'>('select');
  const { toast } = useToast();

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
    const fetchUserDoc = async () => {
      setLoading(true);
      const db = getFirestore(app);
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserDoc(userSnap.exists() ? userSnap.data() : null);
      setLoading(false);
    };
    fetchUserDoc();
  }, [currentUser, authChecked]);

  // Reset step when modal opens
  useEffect(() => {
    if (paymentModal?.open) {
      setPaymentStep('select');
      setStripeClientSecret(null);
      setPaymentError(null);
      setSelectedPayment(null);
    }
  }, [paymentModal?.open]);

  // Payment handler (original working version)
  const handlePayment = async () => {
    setProcessing(true);
    setPaymentError(null);
    let amount = 0;
    let description = '';
    if (paymentModal?.type === 'category' && paymentModal.key && paymentModal.name) {
      // Find the price
      for (const cat of AD_CATEGORIES) {
        const sub = cat.subcategories.find(s => s.key === paymentModal.key);
        if (sub) {
          amount = getPriceEUR(sub.eurPrice);
          description = sub.name;
          break;
        }
      }
    } else if (paymentModal?.type === 'package' && paymentModal.name) {
      const pkg = DASHBOARD_PACKAGES.find(p => p.name === paymentModal.name);
      if (pkg) {
        amount = getPriceEUR(pkg.eurPrice);
        description = pkg.name;
      }
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
        body: JSON.stringify({ amount, description, email: currentUser?.email }),
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

  // PayPal button handlers
  const createPayPalOrder = async (data: any, actions: any) => {
    let amount = 0;
    let description = '';
    
    if (paymentModal?.type === 'category' && paymentModal.key && paymentModal.name) {
      // Find the price
      for (const cat of AD_CATEGORIES) {
        const sub = cat.subcategories.find(s => s.key === paymentModal.key);
        if (sub) {
          amount = getPriceEUR(sub.eurPrice);
          description = sub.name;
          break;
        }
      }
    } else if (paymentModal?.type === 'package' && paymentModal.name) {
      const pkg = DASHBOARD_PACKAGES.find(p => p.name === paymentModal.name);
      if (pkg) {
        amount = getPriceEUR(pkg.eurPrice);
        description = pkg.name;
      }
    }

    if (!amount || !description) {
      throw new Error('Invalid payment details');
    }

    const res = await fetch('/api/payment/paypal-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount, 
        description 
      }),
    });
    
    const orderData = await res.json();
    if (!orderData.orderId) {
      throw new Error(orderData.error || 'Failed to create PayPal order');
    }
    
    return orderData.orderId;
  };

  const onPayPalApprove = async (data: any, actions: any) => {
    try {
      // Capture the payment
      const res = await fetch('/api/payment/paypal-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderID }),
      });
      
      const captureData = await res.json();
      if (captureData.success) {
        // Update Firestore
        await handlePostPayment();
        toast({
          title: "Payment Successful!",
          description: `You have successfully purchased ${paymentModal?.name}.`,
        });
        return Promise.resolve();
      } else {
        throw new Error(captureData.error || 'Payment capture failed');
      }
    } catch (error: any) {
      setPaymentError(error.message || 'Payment failed');
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment.",
        variant: "destructive",
      });
      return Promise.reject(error);
    }
  };

  const onPayPalError = (err: any) => {
    console.error('PayPal error:', err);
    setPaymentError('PayPal payment failed. Please try again.');
    toast({
      title: "Payment Failed",
      description: "PayPal payment failed. Please try again.",
      variant: "destructive",
    });
  };

  // Add CheckoutForm component for Stripe Elements
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

  // Add handlePostPayment to update Firestore after payment
  const handlePostPayment = async () => {
    if (paymentModal?.type === 'category' && paymentModal.key) {
      const db = getFirestore(app);
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        [paymentModal.key]: (userDoc?.[paymentModal.key] || 0) + 1
      });
      setUserDoc({ ...userDoc, [paymentModal.key]: (userDoc?.[paymentModal.key] || 0) + 1 });
    } else if (paymentModal?.type === 'package' && paymentModal.name) {
      const db = getFirestore(app);
      const userRef = doc(db, "users", currentUser.uid);
      if (paymentModal.name === 'Gold Package') {
        await updateDoc(userRef, { goldPackage: (userDoc?.goldPackage || 0) + 1 });
        setUserDoc({ ...userDoc, goldPackage: (userDoc?.goldPackage || 0) + 1 });
      } else if (paymentModal.name === 'Silver Package') {
        await updateDoc(userRef, { silverPackage: (userDoc?.silverPackage || 0) + 1 });
        setUserDoc({ ...userDoc, silverPackage: (userDoc?.silverPackage || 0) + 1 });
      }
    }
    setPaymentModal(null);
    setSelectedPayment(null);
    setStripeClientSecret(null);
    toast({
      title: "Payment Successful!",
      description: `You have successfully purchased ${paymentModal?.name || 'credit'}.`,
    });
  };

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold font-headline text-primary">Advertise Dashboard</h1>
        </div>
        
        {/* Credit Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-2">Your Advertisement Credits</h2>
          <p className="text-muted-foreground mb-6">
            See how many placements you have left in each category and buy more as needed.
          </p>
          {AD_CATEGORIES.map(cat => (
            <div key={cat.title} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{cat.title}</h3>
                <Button 
                  variant="default" 
                  onClick={() => router.push(cat.title === 'Banner Advertisement' ? '/advertise/advertise' : '/advertise/listings')}
                >
                  {cat.title === 'Banner Advertisement' ? 'Create Advertisement' : 
                   cat.title === 'Featured Listing' ? 'Create New Listing' : 
                   cat.title === 'Newsletter Mentions' ? 'Create New Newsletter Mention' : 
                   'Create Advertisement'}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {cat.subcategories.map(sub => (
                  <Card key={sub.name} className="flex flex-col p-6 h-full">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">{sub.name}</span>
                      <span className={`font-bold text-2xl ${userDoc && userDoc[sub.key] === 0 ? 'text-destructive' : 'text-primary'}`}>
                        {userDoc && userDoc[sub.key] !== undefined ? userDoc[sub.key] : 0} Remaining
                      </span>
                    </div>
                    <div className="text-muted-foreground text-sm mb-4 whitespace-pre-line">
                      {SUBCATEGORY_INFO[sub.name]}
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      {formatPriceDisplay(sub.chfPrice, sub.eurPrice, 'suffix' in sub ? sub.suffix : undefined)}
                      <Dialog open={paymentModal?.open && paymentModal.key === sub.key} onOpenChange={open => !open && setPaymentModal(null)}>
                        <DialogTrigger asChild>
                          <Button className="font-bold" variant="default" onClick={() => setPaymentModal({ open: true, type: 'category', key: sub.key, name: sub.name })}>
                            Buy More
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Buy {sub.name}</DialogTitle>
                            <DialogDescription>Choose a payment method to continue.</DialogDescription>
                          </DialogHeader>
                          
                          {paymentStep === 'select' ? (
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
                          ) : (
                            <div className="flex flex-col gap-4 py-4">
                              {selectedPayment === 'stripe' ? (
                                <Elements stripe={stripePromise}>
                                  <CheckoutForm 
                                    onSuccess={handlePostPayment}
                                    onError={(msg) => {
                                      setPaymentError(msg);
                                      toast({
                                        title: "Payment Failed",
                                        description: msg,
                                        variant: "destructive",
                                      });
                                    }}
                                    processing={processing}
                                  />
                                </Elements>
                              ) : selectedPayment === 'paypal' ? (
                                <div className="space-y-4">
                                  <div className="text-center">
                                    <p className="text-lg font-semibold">€{(() => {
                                      if (paymentModal?.type === 'category' && paymentModal.key && paymentModal.name) {
                                        for (const cat of AD_CATEGORIES) {
                                          const sub = cat.subcategories.find(s => s.key === paymentModal.key);
                                          if (sub) {
                                            return getPriceEUR(sub.eurPrice);
                                          }
                                        }
                                      } else if (paymentModal?.type === 'package' && paymentModal.name) {
                                        const pkg = DASHBOARD_PACKAGES.find(p => p.name === paymentModal.name);
                                        if (pkg) {
                                          return getPriceEUR(pkg.eurPrice);
                                        }
                                      }
                                      return 0;
                                    })()}</p>
                                    <p className="text-sm text-muted-foreground">{paymentModal?.name}</p>
                                  </div>
                                  <PayPalButtons
                                    createOrder={createPayPalOrder}
                                    onApprove={onPayPalApprove}
                                    onError={onPayPalError}
                                    style={{ layout: "vertical" }}
                                  />
                                </div>
                              ) : null}
                              {paymentError && <div className="text-red-500 text-sm mt-2">{paymentError}</div>}
                              <Button 
                                variant="outline" 
                                onClick={() => setPaymentStep('select')}
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
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Gold & Silver Packages */}
        <div className="mb-16 mt-8">
          <h2 className="text-2xl font-bold font-headline text-center mb-8">Special Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {DASHBOARD_PACKAGES.map((pkg) => (
              <Card key={pkg.name} className="border-2 border-primary shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-headline text-primary">{pkg.name}</CardTitle>
                  <CardDescription className="text-lg mt-2">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="line-through text-muted-foreground text-sm">{pkg.oldChfPrice} / {pkg.oldEurPrice}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-foreground font-bold text-2xl">{pkg.chfPrice}</span>
                        <span className="text-foreground font-bold text-2xl">/</span>
                        <span className="text-foreground font-bold text-2xl">{pkg.eurPrice}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-semibold text-sm">({pkg.perMonthChf} / {pkg.perMonthEur}/mo)</span>
                        <span className="text-green-600 font-semibold text-sm">{pkg.savings}</span>
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 mt-4">
                  {pkg.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-primary mt-1" />
                      <span className="text-base text-foreground">{f}</span>
                    </div>
                  ))}
                  <div className="flex justify-end mt-6">
                    <Dialog open={paymentModal?.open && paymentModal.name === pkg.name} onOpenChange={open => !open && setPaymentModal(null)}>
                      <DialogTrigger asChild>
                        <Button className="font-bold" variant="default" onClick={() => setPaymentModal({ open: true, type: 'package', name: pkg.name })}>
                          Buy Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Buy {pkg.name}</DialogTitle>
                          <DialogDescription>Choose a payment method to continue.</DialogDescription>
                        </DialogHeader>
                        
                        {paymentStep === 'select' ? (
                          <div className="flex flex-col gap-4 py-4">
                            <div className="flex items-center gap-4">
                              <input 
                                type="radio" 
                                id="pay-stripe-pkg" 
                                name="payment-method-pkg" 
                                value="stripe" 
                                checked={selectedPayment === 'stripe'} 
                                onChange={() => setSelectedPayment('stripe')} 
                              />
                              <Label htmlFor="pay-stripe-pkg">Pay with Card (Stripe)</Label>
                            </div>
                            <div className="flex items-center gap-4">
                              <input 
                                type="radio" 
                                id="pay-paypal-pkg" 
                                name="payment-method-pkg" 
                                value="paypal" 
                                checked={selectedPayment === 'paypal'} 
                                onChange={() => setSelectedPayment('paypal')} 
                              />
                              <Label htmlFor="pay-paypal-pkg">Pay with PayPal</Label>
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
                        ) : (
                          <div className="flex flex-col gap-4 py-4">
                            {selectedPayment === 'stripe' ? (
                              <Elements stripe={stripePromise}>
                                <CheckoutForm 
                                  onSuccess={handlePostPayment}
                                  onError={(msg) => {
                                    setPaymentError(msg);
                                    toast({
                                      title: "Payment Failed",
                                      description: msg,
                                      variant: "destructive",
                                    });
                                  }}
                                  processing={processing}
                                />
                              </Elements>
                            ) : selectedPayment === 'paypal' ? (
                              <div className="space-y-4">
                                <div className="text-center">
                                  <p className="text-lg font-semibold">€{(() => {
                                    if (paymentModal?.type === 'category' && paymentModal.key && paymentModal.name) {
                                      for (const cat of AD_CATEGORIES) {
                                        const sub = cat.subcategories.find(s => s.key === paymentModal.key);
                                        if (sub) {
                                          return getPriceEUR(sub.eurPrice);
                                        }
                                      }
                                    } else if (paymentModal?.type === 'package' && paymentModal.name) {
                                      const pkg = DASHBOARD_PACKAGES.find(p => p.name === paymentModal.name);
                                      if (pkg) {
                                        return getPriceEUR(pkg.eurPrice);
                                      }
                                    }
                                    return 0;
                                  })()}</p>
                                  <p className="text-sm text-muted-foreground">{paymentModal?.name}</p>
                                </div>
                                <PayPalButtons
                                  createOrder={createPayPalOrder}
                                  onApprove={onPayPalApprove}
                                  onError={onPayPalError}
                                  style={{ layout: "vertical" }}
                                />
                              </div>
                            ) : null}
                            {paymentError && <div className="text-red-500 text-sm mt-2">{paymentError}</div>}
                            <Button 
                              variant="outline" 
                              onClick={() => setPaymentStep('select')}
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
} 