"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import { AlertTriangle, Info, Car, Star, Zap, Crown, PlusCircle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { usePricing } from "@/lib/usePricing";
import { validateCoupon } from "@/lib/coupon";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// PayPal configuration
const paypalOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "AW2LLf5-BoTh1ZUKUhs8Ic7nmIfH49BV92y-960SIzcvrO4vlDpLtNKe--xYpNB9Yb3xn7XONXJbErNv",
  currency: "EUR",
  intent: "capture",
};

// Car listing pricing tiers
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
      "Professional video or virtual tour",
      "Maximum exposure to potential buyers",
      "Enhanced visibility for up to 30 days"
    ]
  }
];

// Optional add-ons
const OPTIONAL_ADDONS = [
  {
    name: "Featured in Newsletters",
    price: "CHF 49 / EUR 53",
    priceEUR: 53,
    period: "per week",
    specialOffer: {
      price: "CHF 179 / EUR 192",
      period: "for 1 month",
      savings: "Save 10% when opting for the monthly package!"
    },
    description: "Get featured in our weekly newsletter, reaching a curated list of luxury car enthusiasts and collectors."
  },
  {
    name: "Car Auction Listing",
    price: "CHF 149 / EUR 161",
    priceEUR: 161,
    period: "for 1 month",
    description: "Feature your car in a dedicated auction section on our platform, offering exposure to serious buyers."
  }
];

// Promotional offer info
const PROMOTIONAL_OFFER = {
  title: "Introductory Offer",
  description: "Free car listings until 31st December 2025 as part of our promotional offer.",
  endDate: "31st December 2025"
};

export default function CarsListingPage() {
  const [userDoc, setUserDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  const [paymentModal, setPaymentModal] = useState<{ open: boolean, type: 'tier' | 'addon', name?: string, price?: number } | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'stripe' | 'paypal' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'select' | 'pay'>('select');
  const { toast } = useToast();
  const { get: getPrice } = usePricing();
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponInfo, setCouponInfo] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

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

  // Reset payment state when modal opens
  useEffect(() => {
    if (paymentModal?.open) {
      setPaymentError(null);
      setSelectedPayment(null);
      setPaymentStep('select');
    }
  }, [paymentModal?.open]);

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

  // Payment handler (original working version)
  const handlePayment = async () => {
    setProcessing(true);
    setPaymentError(null);
    
    if (!selectedPayment) {
      setPaymentError('Please select a payment method.');
      setProcessing(false);
      return;
    }

    let amount = paymentModal?.price || 0;
    // map by name for dynamic pricing
    if (paymentModal?.name === 'Basic Listing') amount = getPrice('cars.basic', amount);
    if (paymentModal?.name === 'Enhanced Listing') amount = getPrice('cars.enhanced', amount);
    if (paymentModal?.name === 'Premium Listing') amount = getPrice('cars.premium', amount);
    if (paymentModal?.name === 'Exclusive Banner Placement') amount = getPrice('cars.exclusiveBanner', amount);
    const description = paymentModal?.name || '';

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
          category: 'cars'
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
        body: JSON.stringify({ amount: finalAmount, description, couponCode: couponCode || undefined, category: 'cars' }),
      });
      const data = await res.json();
      if (data.orderId) {
        setPaymentStep('pay');
      } else {
        setPaymentError(data.error || 'Failed to create PayPal order.');
      }
    }
    setProcessing(false);
  };

  // PayPal button handlers
  const createPayPalOrder = async (data: any, actions: any) => {
    if (!paymentModal?.price || !paymentModal?.name) {
      throw new Error('Invalid payment details');
    }

    const res = await fetch('/api/payment/paypal-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount: paymentModal.price, 
        description: paymentModal.name 
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
        // Update Firestore with car purchase
        await handlePostPayment();
        toast({
          title: "Payment Successful",
          description: `Your payment for ${paymentModal?.name} has been processed.`,
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

  // Add handlePostPayment to update Firestore after payment
  const handlePostPayment = async () => {
    if (paymentModal?.type === 'tier' && paymentModal.name) {
      const db = getFirestore(app);
      const userRef = doc(db, "users", currentUser.uid);
      
      // Map tier names to database field names
      let fieldName = '';
      switch (paymentModal.name) {
        case 'Basic Listing':
          fieldName = 'cars_basicListing';
          break;
        case 'Enhanced Listing':
          fieldName = 'cars_enhancedListing';
          break;
        case 'Premium Listing':
          fieldName = 'cars_premiumListing';
          break;
        case 'Exclusive Banner Placement':
          fieldName = 'cars_exclusiveBanner';
          break;
        default:
          fieldName = `cars_${paymentModal.name.toLowerCase().replace(/\s+/g, '')}`;
      }
      
      await updateDoc(userRef, {
        [fieldName]: (userDoc?.[fieldName] || 0) + 1
      });
      setUserDoc({ ...userDoc, [fieldName]: (userDoc?.[fieldName] || 0) + 1 });
    } else if (paymentModal?.type === 'addon' && paymentModal.name) {
      const db = getFirestore(app);
      const userRef = doc(db, "users", currentUser.uid);
      
      // Map addon names to database field names
      let fieldName = '';
      switch (paymentModal.name) {
        case 'Featured in Newsletters':
          fieldName = 'cars_newsletterFeature';
          break;
        case 'Car Auction Listing':
          fieldName = 'cars_auctionListing';
          break;
        default:
          fieldName = `cars_${paymentModal.name.toLowerCase().replace(/\s+/g, '')}`;
      }
      
      await updateDoc(userRef, {
        [fieldName]: (userDoc?.[fieldName] || 0) + 1
      });
      setUserDoc({ ...userDoc, [fieldName]: (userDoc?.[fieldName] || 0) + 1 });
    }
    
    setPaymentModal(null);
    setSelectedPayment(null);
    toast({
      title: "Payment Successful",
      description: `You have successfully purchased ${paymentModal?.name || 'car listing credit'}.`,
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
      // This would need a client secret from a payment intent
      // For now, we'll just call the success callback
      onSuccess();
    };
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <CardElement options={{ hidePostalCode: true }} className="p-2 border rounded" />
        <Button type="submit" className="w-full" disabled={processing}>Pay</Button>
      </form>
    );
  }

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold font-headline text-primary">Car Sale Listings</h1>
        </div>

        {/* Promotional Offer Banner */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-primary mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">{PROMOTIONAL_OFFER.title}</h3>
                <p className="text-muted-foreground mb-2">{PROMOTIONAL_OFFER.description}</p>
                <p className="text-sm text-muted-foreground">Offer ends: {PROMOTIONAL_OFFER.endDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User's Current Car Listings */}
        {userDoc && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Your Current Car Listing Credit</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            </CardContent>
          </Card>
        )}

        {/* Pricing Tiers */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Buy Car Listings</h2>
          
          {/* Already have Credit section */}
          <div className="mb-8 p-4 bg-muted border rounded-lg max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <p className="text-base text-foreground">Already have enough Credit to post your car?</p>
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/cars/sell" className="flex items-center">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  List Your Car
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CAR_LISTING_TIERS.map((tier) => (
              <Card key={tier.name} className="flex flex-col h-full">
                <CardHeader className="text-center p-6 pb-4">
                  <div className="flex justify-center mb-2">
                    <tier.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <CardDescription className="text-xl font-bold text-primary">
                    {tier.price}
                    <span className="text-sm font-normal text-muted-foreground"> / month</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 p-6 pt-0">
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-semibold text-primary">{tier.price}</span>
                    <Dialog open={paymentModal?.open && paymentModal.name === tier.name} onOpenChange={(open) => !open && setPaymentModal(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setPaymentModal({ open: true, type: 'tier', name: tier.name, price: tier.priceEUR })}
                        >
                          Buy €{tier.priceEUR}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Purchase {tier.name}</DialogTitle>
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
                            <div className="flex items-center gap-2">
                              <Input placeholder="Coupon code (optional)" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                              <Button
                                variant="outline"
                                onClick={async () => {
                                  let amt = paymentModal?.price || 0;
                                  if (paymentModal?.name === 'Basic Listing') amt = getPrice('cars.basic', amt);
                                  if (paymentModal?.name === 'Enhanced Listing') amt = getPrice('cars.enhanced', amt);
                                  if (paymentModal?.name === 'Premium Listing') amt = getPrice('cars.premium', amt);
                                  if (paymentModal?.name === 'Exclusive Banner Placement') amt = getPrice('cars.exclusiveBanner', amt);
                                  if (!couponCode || !amt) { setCouponInfo(''); setCouponDiscount(0); return; }
                                  const res = await validateCoupon(couponCode, 'cars', amt);
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
                                  onSuccess={() => {
                                    setPaymentModal(null);
                                    setSelectedPayment(null);
                                  }}
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
                                  <p className="text-lg font-semibold">€{paymentModal?.price}</p>
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

        {/* Optional Add-ons */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Optional Add-ons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {OPTIONAL_ADDONS.map((addon) => (
              <Card key={addon.name} className="flex flex-col h-full">
                <CardHeader className="p-6 pb-4">
                  <CardTitle className="text-lg">{addon.name}</CardTitle>
                  <CardDescription className="text-lg font-bold text-primary">
                    {addon.price} <span className="text-sm font-normal text-muted-foreground">{addon.period}</span>
                  </CardDescription>
                  {addon.specialOffer && (
                    <div className="mt-2 p-3 bg-muted border rounded">
                      <p className="text-sm font-semibold mb-1">Special Offer:</p>
                      <p className="text-sm">{addon.specialOffer.price} {addon.specialOffer.period}</p>
                      <p className="text-xs text-muted-foreground">{addon.specialOffer.savings}</p>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col flex-1 p-6 pt-0">
                  <p className="text-sm text-muted-foreground mb-6">{addon.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-semibold text-primary">{addon.price}</span>
                    <Dialog open={paymentModal?.open && paymentModal.name === addon.name} onOpenChange={open => !open && setPaymentModal(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          onClick={() => setPaymentModal({ open: true, type: 'addon', name: addon.name, price: addon.priceEUR })}
                        >
                          Buy Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Purchase {addon.name}</DialogTitle>
                          <DialogDescription>Choose a payment method to continue.</DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4">
                          <div className="flex items-center gap-4">
                            <input 
                              type="radio" 
                              id="pay-stripe-addon" 
                              name="payment-method-addon" 
                              value="stripe" 
                              checked={selectedPayment === 'stripe'} 
                              onChange={() => setSelectedPayment('stripe')} 
                            />
                            <Label htmlFor="pay-stripe-addon">Pay with Card (Stripe)</Label>
                          </div>
                          <div className="flex items-center gap-4">
                            <input 
                              type="radio" 
                              id="pay-paypal-addon" 
                              name="payment-method-addon" 
                              value="paypal" 
                              checked={selectedPayment === 'paypal'} 
                              onChange={() => setSelectedPayment('paypal')} 
                            />
                            <Label htmlFor="pay-paypal-addon">Pay with PayPal</Label>
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

        {/* VAT Notice */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Info className="w-6 h-6 text-primary mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Important Notice</h3>
                <p className="text-muted-foreground">All prices are subject to VAT. Please ensure you have the necessary documentation for your business transactions.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PayPalScriptProvider>
  );
} 