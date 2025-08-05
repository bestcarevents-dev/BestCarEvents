"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UploadCloud, CheckCircle, Star, Award, Users, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { loadStripe } from "@stripe/stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Elements } from '@stripe/react-stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PARTNER_PACKAGES = [
  {
    name: "Silver Partner",
    key: "silver",
    chfPrice: "CHF 2'200",
    eurPrice: "EUR 2'000",
    features: [
      "Dedicated section in partners area",
      "2 free category banner ads",
      "All ads/products shown in partner section"
    ],
    adUpdates: {
      partnerSilverPackage: 1,
      categoryBannerRemaining: 2,
    },
    priceEUR: 2000,
    priceCHF: 2200,
  },
  {
    name: "Gold Partner",
    key: "gold",
    chfPrice: "CHF 3'300",
    eurPrice: "EUR 3'000",
    features: [
      "Dedicated section in partners area",
      "2 free category banner ads",
      "1 free homepage banner ad",
      "All ads/products shown in partner section"
    ],
    adUpdates: {
      partnerGoldPackage: 1,
      categoryBannerRemaining: 2,
      homepageBannerRemaining: 1,
    },
    priceEUR: 3000,
    priceCHF: 3300,
  },
];

const partnerSchema = z.object({
  businessName: z.string().min(2, "Business name required"),
  categories: z.array(z.string()).min(1, "At least one category required"),
  contactEmail: z.string().email("Invalid email address"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  logo: z.any().refine(
    (file) => typeof window === "undefined" || (file instanceof File && file.size > 0),
    "Logo is required"
  ),
  partnerName: z.string().min(2, "Partner name required"),
  paymentMethod: z.string(),
  phone: z.string().min(5, "Phone required"),
  socialMedia: z.string().url("Invalid URL").optional().or(z.literal('')),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

const DEFAULT_CATEGORIES = [
  "Tires & Wheels",
  "Car Transport & Logistics",
  "Detailing & Wraps",
  "Performance Parts",
  "Car Audio & Electronics",
  "Restoration & Classics",
  "Car Storage",
  "Insurance & Finance",
  "Custom (enter below)"
];

export default function BecomePartnerPage() {
  const [step, setStep] = useState<'choose' | 'pay' | 'form'>('choose');
  const [selectedPackage, setSelectedPackage] = useState<typeof PARTNER_PACKAGES[0] | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'stripe' | 'paypal' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const db = getFirestore(app);
  const storage = getStorage(app);

  // Form
  const { control, register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: { categories: [] },
  });

  // Auth/user doc
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    const fetchUserDoc = async () => {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserDoc(userSnap.exists() ? userSnap.data() : null);
      setLoading(false);
    };
    fetchUserDoc();
  }, [currentUser]);

  // Fix the useEffect that checks for existing packages - ONLY check package counts
  useEffect(() => {
    if (!userDoc) return;
    if ((userDoc.partnerSilverPackage && userDoc.partnerSilverPackage > 0) || (userDoc.partnerGoldPackage && userDoc.partnerGoldPackage > 0)) {
      setStep('form');
      setSelectedPackage((userDoc.partnerGoldPackage && userDoc.partnerGoldPackage > 0) ? PARTNER_PACKAGES[1] : PARTNER_PACKAGES[0]);
    }
  }, [userDoc]);

  // Fix the main useEffect that checks for existing partner status - ONLY check package counts
  useEffect(() => {
    if (!loading && userDoc && (
      (userDoc.partnerSilverPackage && userDoc.partnerSilverPackage > 0) || 
      (userDoc.partnerGoldPackage && userDoc.partnerGoldPackage > 0)
    )) {
      setStep('form');
      setSelectedPackage(
        (userDoc.partnerGoldPackage && userDoc.partnerGoldPackage > 0) 
          ? PARTNER_PACKAGES[1] 
          : PARTNER_PACKAGES[0]
      );
    }
  }, [userDoc, loading]);

  // Image preview cleanup
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // Payment logic
  const handlePayment = async () => {
    setProcessing(true);
    setPaymentError(null);
    const pkg = selectedPackage;
    if (!pkg || !currentUser) {
      setPaymentError('No package or user.');
      setProcessing(false);
      return;
    }
    if (selectedPayment === 'stripe') {
      // Call API to create Stripe Checkout session - webhook will handle updates
      const res = await fetch('/api/payment/stripe-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: pkg.priceEUR, 
          description: pkg.name + ' Partner',
          email: currentUser.email,
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
      // PayPal still uses client-side updates
      const res = await fetch('/api/payment/paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: pkg.priceEUR, description: pkg.name + ' Partner' }),
      });
      const data = await res.json();
      if (data.orderId) {
        setStep('pay');
      } else {
        setPaymentError(data.error || 'Failed to create PayPal order.');
      }
      setProcessing(false);
    }
  };

  // Keep handlePostPayment only for PayPal
  const handlePostPayment = async () => {
    if (!selectedPackage || !currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    let updates: any = {};
    if (selectedPackage.key === 'silver') {
      updates = {
        partnerSilverPackage: (userDoc?.partnerSilverPackage || 0) + 1,
        categoryBannerRemaining: (userDoc?.categoryBannerRemaining || 0) + 2,
        featuredListingRemaining: (userDoc?.featuredListingRemaining || 0) + 1,
        standardNewsletterRemaining: (userDoc?.standardNewsletterRemaining || 0) + 12,
        silverPartner: true,
        partnerStart: new Date(),
        partnerEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      };
    } else if (selectedPackage.key === 'gold') {
      updates = {
        partnerGoldPackage: (userDoc?.partnerGoldPackage || 0) + 1,
        categoryBannerRemaining: (userDoc?.categoryBannerRemaining || 0) + 2,
        homepageBannerRemaining: (userDoc?.homepageBannerRemaining || 0) + 1,
        featuredListingRemaining: (userDoc?.featuredListingRemaining || 0) + 1,
        premiumNewsletterRemaining: (userDoc?.premiumNewsletterRemaining || 0) + 12,
        goldPartner: true,
        partnerStart: new Date(),
        partnerEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      };
    }
    await updateDoc(userRef, updates);
    setUserDoc({ ...userDoc, ...updates });
    setStep('form');
    setPaymentModal(false);
    setSelectedPayment(null);
    toast({ title: "Payment Successful!", description: `You are now a ${selectedPackage.name}.` });
  };

  // PayPal button handlers
  const createPayPalOrder = async () => {
    if (!selectedPackage) return '';
    const res = await fetch('/api/payment/paypal-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: selectedPackage.priceEUR, description: selectedPackage.name + ' Partner' }),
    });
    const data = await res.json();
    return data.orderId;
  };

  const onPayPalApprove = async (data: any) => {
    await fetch('/api/payment/paypal-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: data.orderID }),
    });
    await handlePostPayment();
  };

  // Form submit
  const onSubmit = async (data: PartnerFormData) => {
    if (!currentUser) return;
    let logoUrl = '';
    if (data.logo) {
      const imageRef = ref(storage, `partner_logos/${Date.now()}_${data.logo.name}`);
      await uploadBytes(imageRef, data.logo);
      logoUrl = await getDownloadURL(imageRef);
    }
    // Remove the logo field before saving to Firestore
    const { logo, ...rest } = data;
    await addDoc(collection(db, "partners"), {
      ...rest,
      logoUrl,
      status: "approved",
      createdAt: new Date(),
      submittedAt: new Date(),
      uploadedByUserEmail: currentUser.email,
      uploadedByUserId: currentUser.uid,
      partnerSilverPackage: selectedPackage?.key === 'silver',
      partnerGoldPackage: selectedPackage?.key === 'gold',
      silverPartner: selectedPackage?.key === 'silver',
      goldPartner: selectedPackage?.key === 'gold',
    });
    toast({ title: "Submission Successful!", description: "Your partner profile has been created." });
    router.push("/partners");
  };

  // Add effect to handle Stripe success redirect and check for webhook updates
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    if (success === '1') {
      // Stripe payment successful, check if webhook updated the user
      const checkWebhookUpdate = async () => {
        if (currentUser) {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          const updatedUserDoc = userSnap.exists() ? userSnap.data() : null;
          
          if (updatedUserDoc && (
            (updatedUserDoc.partnerSilverPackage && updatedUserDoc.partnerSilverPackage > 0) ||
            (updatedUserDoc.partnerGoldPackage && updatedUserDoc.partnerGoldPackage > 0)
          )) {
            // Webhook updated the user, show success and form
            setUserDoc(updatedUserDoc);
            setSelectedPackage(
              (updatedUserDoc.partnerGoldPackage && updatedUserDoc.partnerGoldPackage > 0) 
                ? PARTNER_PACKAGES[1] 
                : PARTNER_PACKAGES[0]
            );
            setStep('form');
            toast({ title: "Payment Successful!", description: "Your partner package has been activated!" });
          } else {
            // Webhook hasn't updated yet, show loading
            toast({ title: "Processing Payment", description: "Please wait while we activate your package..." });
            // Retry after 2 seconds
            setTimeout(checkWebhookUpdate, 2000);
          }
        }
      };
      
      checkWebhookUpdate();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUser]);

  // UI
  if (loading) return <div className="py-24 text-center text-2xl font-bold animate-pulse">Loading...</div>;

  return (
    <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '', currency: "EUR", intent: "capture" }}>
      <div className="bg-white min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {step === 'choose' && 
            !(userDoc?.partnerSilverPackage && userDoc.partnerSilverPackage > 0) && 
            !(userDoc?.partnerGoldPackage && userDoc.partnerGoldPackage > 0) && (
            <>
              {/* Hero Section */}
              <div className="w-full flex flex-col items-center justify-center mb-10 bg-gradient-to-r from-yellow-50 via-white to-yellow-100 py-10 rounded-xl shadow-md">
                <div className="flex flex-col items-center">
                  <Award className="w-16 h-16 text-yellow-500 mb-4" />
                  <h1 className="text-5xl font-extrabold text-center mb-4 text-black drop-shadow-lg">Become a Partner</h1>
                  <p className="text-xl text-gray-700 text-center max-w-2xl mb-2 font-medium">Grow your business. Get noticed by thousands of car enthusiasts. Unlock exclusive features and boost your brand with our premium partner plans.</p>
                  <p className="text-base text-yellow-700 font-semibold mt-2">Limited slots available for Gold Partner!</p>
                </div>
              </div>
              {/* Package Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                {PARTNER_PACKAGES.map((pkg, idx) => (
                  <div key={pkg.key} className={`relative transition-all duration-300 ${pkg.key === 'gold' ? 'border-4 border-yellow-400 shadow-2xl bg-gradient-to-br from-yellow-100 via-white to-yellow-200' : 'border-2 border-gray-300 shadow-lg bg-gradient-to-br from-gray-100 via-white to-gray-200'} rounded-2xl p-8 flex flex-col items-center hover:scale-105 hover:shadow-2xl`}>
                    {/* Most Popular Badge */}
                    {pkg.key === 'gold' && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-400 text-white font-bold px-4 py-1 rounded-full shadow-lg text-sm z-10 border-2 border-yellow-600">Most Popular</span>
                    )}
                    <h2 className={`text-2xl font-extrabold mb-2 ${pkg.key === 'gold' ? 'text-yellow-700' : 'text-gray-800'}`}>{pkg.name}</h2>
                    <div className="flex flex-col items-center mb-4">
                      <span className={`font-bold text-3xl ${pkg.key === 'gold' ? 'text-yellow-700' : 'text-gray-900'}`}>{pkg.chfPrice}</span>
                      <span className="font-bold text-xl text-gray-700">/ {pkg.eurPrice}</span>
                    </div>
                    <ul className="text-base text-gray-800 mb-6 space-y-2 w-full">
                      <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Dedicated section in partners area</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> 2 free category banner ads</li>
                      {pkg.key === 'gold' && <li className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> 1 free homepage banner ad</li>}
                      <li className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" /> All ads/products shown in partner section</li>
                    </ul>
                    <Button className={`w-full py-3 text-lg font-bold flex items-center justify-center gap-2 ${pkg.key === 'gold' ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} border-2 border-yellow-600 rounded-lg shadow-md transition-all`} onClick={() => { setSelectedPackage(pkg); setPaymentModal(true); }}>
                      Choose <ArrowRight className="w-5 h-5" />
                    </Button>
                    <div className="text-xs text-gray-600 mt-2">No hidden fees. Instant activation.</div>
                  </div>
                ))}
              </div>
              {/* Social Proof/Testimonial */}
              <div className="flex flex-col items-center mt-8 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-6 h-6 text-yellow-400" />
                  <span className="text-lg font-bold text-gray-900">Trusted by many!    </span>
                </div>
                <blockquote className="italic text-gray-700 max-w-xl text-center">“Joining as a Gold Partner gave our business a huge boost. The exposure and support are unmatched!”</blockquote>
              </div>
            </>
          )}

          {/* Payment Modal */}
          <Dialog open={paymentModal} onOpenChange={open => { if (!open) setPaymentModal(false); }}>
            <DialogContent className="max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="text-black font-bold">Buy {selectedPackage?.name}</DialogTitle>
                <DialogDescription className="text-gray-700">Choose a payment method to continue.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex items-center gap-4">
                  <input type="radio" id="pay-stripe" name="payment-method" value="stripe" checked={selectedPayment === 'stripe'} onChange={() => setSelectedPayment('stripe')} />
                  <Label htmlFor="pay-stripe" className="text-black">Pay with Card (Stripe)</Label>
                </div>
                <div className="flex items-center gap-4">
                  <input type="radio" id="pay-paypal" name="payment-method" value="paypal" checked={selectedPayment === 'paypal'} onChange={() => setSelectedPayment('paypal')} />
                  <Label htmlFor="pay-paypal" className="text-black">Pay with PayPal</Label>
                </div>
                <Button className="w-full mt-4 font-bold text-lg bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-600" onClick={handlePayment} disabled={processing || !selectedPayment}>Continue</Button>
                {paymentError && <div className="text-red-600 text-sm mt-2 font-bold">{paymentError}</div>}
              </div>
              {selectedPayment === 'paypal' && (
                <div className="space-y-4">
                  <PayPalButtons
                    createOrder={async () => await createPayPalOrder()}
                    onApprove={onPayPalApprove}
                    onError={(err) => setPaymentError('PayPal payment failed. Please try again.')}
                    style={{ layout: "vertical" }}
                  />
                </div>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Partner Form */}
          {step === 'form' && (
            <Card className="max-w-2xl mx-auto bg-white border border-gray-300 shadow-lg">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="text-3xl font-bold text-black">Partner Onboarding</CardTitle>
                <CardDescription className="text-gray-700">Fill out the form to complete your partner profile.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-black font-semibold">Business Name</Label>
                    <Input id="businessName" {...register("businessName")} className="text-black bg-white border-gray-300" />
                    {errors.businessName && <p className="text-red-600 text-sm font-bold">{errors.businessName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-black font-semibold">Categories</Label>
                    <Controller
                      name="categories"
                      control={control}
                      render={({ field }) => (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {DEFAULT_CATEGORIES.map((cat) => {
                            const checked = field.value.includes(cat);
                            return (
                              <label
                                key={cat}
                                className="flex items-center gap-2 text-sm bg-yellow-100 px-3 py-1 rounded-full cursor-pointer text-black font-medium select-none"
                                style={{ userSelect: 'none' }}
                              >
                                <input
                                  type="checkbox"
                                  value={cat}
                                  checked={checked}
                                  onChange={e => {
                                    if (e.target.checked) field.onChange([...field.value, cat]);
                                    else field.onChange(field.value.filter((c: string) => c !== cat));
                                  }}
                                  className="form-checkbox h-5 w-5 text-yellow-600 border-gray-400 focus:ring-yellow-500 cursor-pointer"
                                />
                                <span className="ml-1">{cat}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    />
                    <Input
                      placeholder="Add custom category"
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && customCategory.trim()) {
                          e.preventDefault();
                          // Use setValue from react-hook-form to update categories
                          const prev = getValues("categories");
                          setValue("categories", [...prev, customCategory.trim()]);
                          setCustomCategory('');
                        }
                      }}
                      className="text-black bg-white border-gray-300"
                    />
                    <div className="text-xs text-gray-600 mt-1">Press Enter to add custom category</div>
                    {errors.categories && <p className="text-red-600 text-sm font-bold">{errors.categories.message as string}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-black font-semibold">Contact Email</Label>
                    <Input id="contactEmail" {...register("contactEmail")} className="text-black bg-white border-gray-300" />
                    {errors.contactEmail && <p className="text-red-600 text-sm font-bold">{errors.contactEmail.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-black font-semibold">Description</Label>
                    <Textarea id="description" {...register("description")} rows={5} className="text-black bg-white border-gray-300" />
                    {errors.description && <p className="text-red-600 text-sm font-bold">{errors.description.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo" className="text-black font-semibold">Logo</Label>
                    <div className="flex flex-col items-center justify-center w-full">
                      {imagePreview && (
                        <img src={imagePreview} alt="Preview" className="mb-4 rounded-lg max-h-32 object-contain border border-gray-300" />
                      )}
                      <label htmlFor="logo" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="mb-1 text-sm text-gray-700"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 800x400px)</p>
                        </div>
                        <Controller
                          name="logo"
                          control={control}
                          render={({ field }) => (
                            <Input
                              id="logo"
                              type="file"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files ? e.target.files[0] : null;
                                field.onChange(file);
                                if (file) setImagePreview(URL.createObjectURL(file));
                                else setImagePreview(null);
                              }}
                            />
                          )}
                        />
                      </label>
                    </div>
                    {errors.logo && <p className="text-red-600 text-sm font-bold">{errors.logo.message as string}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partnerName" className="text-black font-semibold">Partner Name</Label>
                    <Input id="partnerName" {...register("partnerName")} className="text-black bg-white border-gray-300" />
                    {errors.partnerName && <p className="text-red-600 text-sm font-bold">{errors.partnerName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-black font-semibold">Phone</Label>
                    <Input id="phone" {...register("phone")} className="text-black bg-white border-gray-300" />
                    {errors.phone && <p className="text-red-600 text-sm font-bold">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-black font-semibold">Website</Label>
                    <Input id="website" {...register("website")} className="text-black bg-white border-gray-300" />
                    {errors.website && <p className="text-red-600 text-sm font-bold">{errors.website.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="socialMedia" className="text-black font-semibold">Social Media</Label>
                    <Input id="socialMedia" {...register("socialMedia")} className="text-black bg-white border-gray-300" />
                    {errors.socialMedia && <p className="text-red-600 text-sm font-bold">{errors.socialMedia.message}</p>}
                  </div>
                  <input type="hidden" {...register("paymentMethod")} value={selectedPayment || 'card'} />
                  <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-600 font-bold text-lg">Submit</Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PayPalScriptProvider>
  );
} 