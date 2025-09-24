"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from "firebase/storage";
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
import { UploadCloud, X, Car, Star, Zap, Crown, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import { loadStripe } from "@stripe/stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Elements } from '@stripe/react-stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useToast } from "@/hooks/use-toast";
import { createCarRequestNotification } from "@/lib/notifications";
import { usePricing } from "@/lib/usePricing";
import LocationPicker, { type LocationData } from "@/components/LocationPicker";
import { Switch } from "@/components/ui/switch";
import ConsentCheckbox from "@/components/form/ConsentCheckbox";
import { useFormPreferences } from "@/hooks/useFormPreferences";

const carFeatures = ["Air Conditioning", "Power Steering", "Power Windows", "Sunroof/Moonroof", "Navigation System", "Bluetooth", "Backup Camera", "Leather Seats", "Heated Seats"] as const;

// Car listing pricing tiers
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const paypalOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "AW2LLf5-BoTh1ZUKUhs8Ic7nmIfH49BV92y-960SIzcvrO4vlDpLtNKe--xYpNB9Yb3xn7XONXJbErNv",
  currency: "EUR",
  intent: "capture",
};
// Car listing tiers from advertise page
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
    ],
    maxImages: 5
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
    ],
    maxImages: 10
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
    ],
    maxImages: 10
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
    ],
    maxImages: 10
  }
];

const carSchema = z.object({
  // Basic Info
  make: z.string().min(2, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().min(1900, "Invalid year").max(new Date().getFullYear() + 1, "Invalid year"),
  price: z.string().min(1, "Price is required"),
  currency: z.string().min(1, "Currency is required"),
  mileage: z.number().positive("Mileage must be positive"),
  
  // Detailed Specs
  vin: z.string().length(17, "VIN must be 17 characters").optional().or(z.literal('')),
  bodyStyle: z.string().min(2, "Body style is required"),
  engine: z.string().min(2, "Engine details are required"),
  transmission: z.enum(["Automatic", "Manual"]),
  drivetrain: z.enum(["FWD", "RWD", "AWD", "4WD"]),
  exteriorColor: z.string().min(2, "Exterior color is required"),
  interiorColor: z.string().min(2, "Interior color is required"),

  // Location
  location: z.string().min(2, "Location is required"),
  locationData: z.custom<LocationData>((v) => !!v && typeof v === 'object').refine((v: any) => v?.formattedAddress && typeof v.latitude === 'number' && typeof v.longitude === 'number', {
    message: "Please select a valid location from suggestions or map",
  }),
  addressLine: z.string().min(2, "Address is required"),
  city: z.string().min(1, "City is required"),
  region: z.string().min(1, "Region/State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "ZIP/Postal code is required"),
  privacyMode: z.boolean().optional().default(false),
  
  // Description & Condition
  description: z.string().min(20, "Description must be at least 20 characters"),
  conditionDetails: z.string().min(10, "Condition details are required"),
  
  // Features
  features: z.array(z.string()).optional(),

  // Seller Info
  sellerName: z.string().min(3, "Seller name is required"),
  sellerContact: z.string().email("Invalid email address"),
  
  // Media
  images: z
    .array(z.any())
    .refine(
      files => typeof window === "undefined" || (Array.isArray(files) && files.length > 0 && files.every(file => file instanceof File)),
      "At least one image is required"
    ),
  video: z.any().optional(),
  // Consent
  mediaConsent: z
    .boolean()
    .refine((val) => val === true, {
      message: "You must confirm you have required consent and rights",
    }),
});

type CarFormData = z.infer<typeof carSchema>;

export default function SellCarPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [selectedListingType, setSelectedListingType] = useState<string>("");
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [isFreeListing, setIsFreeListing] = useState<boolean>(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const router = useRouter();
  const db = getFirestore(app);
  const storage = getStorage(app);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);

  // Payment modal state
  const [creditPaymentModal, setCreditPaymentModal] = useState<{ open: boolean; tierKey: string | null }>({ open: false, tierKey: null });
  const [creditPaymentStep, setCreditPaymentStep] = useState<'selectTier' | 'selectPayment' | 'pay'>('selectTier');
  const [creditSelectedTier, setCreditSelectedTier] = useState<any>(null);
  const [creditSelectedPayment, setCreditSelectedPayment] = useState<'stripe' | 'paypal' | null>(null);
  const [creditProcessing, setCreditProcessing] = useState(false);
  const [creditStripeClientSecret, setCreditStripeClientSecret] = useState<string | null>(null);
  const [creditPaymentError, setCreditPaymentError] = useState<string | null>(null);
  // Track a listing type the user attempted to select without credit
  const [pendingListingSelection, setPendingListingSelection] = useState<string | null>(null);
  const { get: getPrice } = usePricing();
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponInfo, setCouponInfo] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  const { toast } = useToast();
  const carPrefs = useFormPreferences("cars");

  const { control, register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CarFormData>({
    resolver: zodResolver(carSchema),
    defaultValues: {
        features: [],
        currency: "USD",
        privacyMode: false,
        mediaConsent: false,
    }
  });
  const [customFeature, setCustomFeature] = useState("");

  // Get max images based on selected listing type
  const getMaxImages = () => {
    if (isFreeListing) return 5; // Free listings get 5 images
    if (!selectedTier) return 10;
    return selectedTier.maxImages;
  };

  // Check if video upload is allowed
  const isVideoAllowed = () => {
    if (isFreeListing) return false;
    return selectedTier && (selectedTier.key === 'premiumListing' || selectedTier.key === 'exclusiveBanner');
  };

  useEffect(() => {
    // Cleanup previews on unmount
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [imagePreviews, videoPreview]);

  // Check settings for free listing
  useEffect(() => {
    const checkSettings = async () => {
      try {
        const settingsRef = doc(db, "settings", "carlisting");
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          setIsFreeListing(settingsSnap.data()?.isFree || false);
        }
        setSettingsLoading(false);
      } catch (error) {
        console.error("Error fetching settings:", error);
        setIsFreeListing(false);
        setSettingsLoading(false);
      }
    };
    checkSettings();
  }, [db]);

  // Get current user and fetch user document
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && !isFreeListing) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        setUserDoc(userSnap.exists() ? userSnap.data() : null);
      }
    });
    return () => unsubscribe();
  }, [db, isFreeListing]);

  // Update selected tier when listing type changes
  useEffect(() => {
    if (!isFreeListing) {
      const tier = CAR_LISTING_TIERS.find(t => t.key === selectedListingType);
      setSelectedTier(tier);
    }
  }, [selectedListingType, isFreeListing]);

  // Sync images with react-hook-form
  useEffect(() => {
    setValue("images", images);
  }, [images, setValue]);

  const onSubmit = async (data: CarFormData) => {
    if (!isFreeListing && !selectedListingType) {
      alert("Please select a listing type");
      return;
    }

    // Check quota only if not free listing
    if (!isFreeListing) {
      const quotaField = `cars_${selectedListingType}`;
      const currentQuota = userDoc?.[quotaField] || 0;
      
      if (currentQuota < 1) {
        alert(`You don't have enough Credit for ${selectedTier?.name}. Please purchase more Credit.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Show initial progress
      toast({
        title: "Starting submission...",
        description: "Preparing your car listing for upload.",
      });

      const imageUrls = [];
      const files = images;

      if (files.length === 0) {
          setIsSubmitting(false);
          toast({
            title: "Submission Failed",
            description: "At least one image is required.",
            variant: "destructive",
          });
          return;
      }

      // Upload images
      toast({
        title: "Uploading images...",
        description: `Uploading ${files.length} image${files.length > 1 ? 's' : ''} to our servers.`,
      });

      for (let i = 0; i < Array.from(files).length; i++) {
        const file = Array.from(files)[i];
        const imageRef = ref(storage, `car_images/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
        
        // Update progress for each image
        if (i < files.length - 1) {
          toast({
            title: "Uploading images...",
            description: `Uploaded ${i + 1} of ${files.length} images.`,
          });
        }
      }

      // Upload video if provided and allowed
      let videoUrl = null;
      const currentVideo = video; // Get the video from state
      if (currentVideo && isVideoAllowed()) {
        toast({
          title: "Uploading video...",
          description: "Uploading your professional video. This may take a few moments.",
        });

        const videoRef = ref(storage, `car_videos/${Date.now()}_${currentVideo.name}`);
        
        // Create upload task for progress tracking
        const uploadTask = uploadBytesResumable(videoRef, currentVideo);
        
        // Track upload progress
        uploadTask.on('state_changed', 
          (snapshot: any) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setVideoUploadProgress(progress);
          },
          (error: any) => {
            console.error('Video upload error:', error);
            throw new Error('Video upload failed');
          }
        );
        
        await uploadTask;
        videoUrl = await getDownloadURL(videoRef);
        
        toast({
          title: "Video uploaded successfully!",
          description: "Your professional video has been uploaded.",
        });
      }

      // Save to database
      toast({
        title: "Saving listing...",
        description: "Saving your car listing to our database.",
      });

      // Add car to database
      const { video: formVideo, ...carDataWithoutVideo } = data; // Remove video field from data
      const carData = {
        ...carDataWithoutVideo,
        images: imageUrls,
        videoUrl: videoUrl,
        locationData: (data as any).locationData,
        addressLine: (data as any).addressLine,
        city: (data as any).city,
        region: (data as any).region,
        country: (data as any).country,
        postalCode: (data as any).postalCode,
        privacyMode: !!(data as any).privacyMode,
        mediaConsent: !!(data as any).mediaConsent,
        listing_type: isFreeListing ? "free" : selectedListingType,
        status: "pending",
        submittedAt: new Date(),
        uploadedByUserId: currentUser?.uid || null,
        uploadedByUserEmail: currentUser?.email || null,
      };

      const docRef = await addDoc(collection(db, "pendingCars"), carData);
      
      // Create notification (non-blocking)
      try {
        await createCarRequestNotification({
          ...carData,
          id: docRef.id,
          userId: currentUser?.uid || null
        });
      } catch (notificationError) {
        console.error('Error creating car notification:', notificationError);
        // Don't fail the submission if notification fails
      }

      // Decrease user's quota only if not free listing
      if (!isFreeListing && currentUser) {
        const quotaField = `cars_${selectedListingType}`;
        const currentQuota = userDoc?.[quotaField] || 0;
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
          [quotaField]: currentQuota - 1
        });
        // Update local state
        setUserDoc({ ...userDoc, [quotaField]: currentQuota - 1 });
      }

      toast({
        title: "Submission Successful!",
        description: "Your car listing has been submitted for approval. You will be notified once it's reviewed.",
      });

      router.push("/cars/submission-success");
    } catch (error) {
      console.error("Error submitting car:", error);
      setIsSubmitting(false);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your car listing. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (settingsLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12 text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Free Listing Promotional Message */}
      {isFreeListing ? (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Car className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">🎉 Promotional Offer!</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Free car listings until <span className="font-bold text-primary">31st November 2025</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Sell smarter. No listing fees until 31st November 2025. Submit your car with up to 5 images at no cost.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Quota Cards Section */}
          {userDoc && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Your Current Car Listing Credit</h3>
                  <Button 
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    onClick={() => setCreditPaymentModal({ open: true, tierKey: null })}
                  >
                    Buy More Credit
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {CAR_LISTING_TIERS.map((tier) => (
                    <div key={tier.name} className="text-center p-3 bg-muted rounded">
                      <div className="flex justify-center mb-2">
                        <tier.icon className="w-6 h-6 text-primary" />
                      </div>
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

          {/* Listing Type Selection */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Select Listing Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {CAR_LISTING_TIERS.map((tier) => {
                  const quotaField = `cars_${tier.key}`;
                  const currentQuota = userDoc?.[quotaField] || 0;
                  const hasQuota = currentQuota > 0;
                  
                  return (
                    <div 
                      key={tier.key}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedListingType === tier.key 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => {
                        if (hasQuota) {
                          setSelectedListingType(tier.key);
                        } else {
                          // Open purchase modal for this tier and preselect it
                          setPendingListingSelection(tier.key);
                          setCreditPaymentModal({ open: true, tierKey: tier.key });
                          setCreditSelectedTier(tier);
                          setCreditPaymentStep('selectPayment');
                          setCreditSelectedPayment(null);
                          setCreditStripeClientSecret(null);
                          setCreditPaymentError(null);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <tier.icon className="w-6 h-6 text-primary" />
                        <div>
                          <h4 className="font-semibold">{tier.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {currentQuota} remaining
                          </p>
                        </div>
                      </div>
                      {!hasQuota && (
                        <p className="text-xs text-red">No Credit available. Click to buy.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Listing Benefits */}
          {selectedTier && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <selectedTier.icon className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-semibold">{selectedTier.name} Benefits</h3>
                </div>
                <ul className="space-y-2">
                  {selectedTier.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline text-primary">Sell Your Car</CardTitle>
          <CardDescription>Provide detailed information about your vehicle to create a comprehensive listing for potential buyers.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Basic Info Section */}
            <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Basic Information</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="make">Make</Label>
                        <Input id="make" {...register("make")} />
                        {errors.make && <p className="text-red-500 text-sm">{errors.make.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Input id="model" {...register("model")} />
                        {errors.model && <p className="text-red-500 text-sm">{errors.model.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Input id="year" type="number" {...register("year", { valueAsNumber: true })} />
                        {errors.year && <p className="text-red-500 text-sm">{errors.year.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <div className="flex gap-2">
                            <Input id="price" type="text" placeholder="Enter price" {...register("price")} className="flex-1" />
                            <Controller
                                name="currency"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger className="w-24">
                                            <SelectValue placeholder="Currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="CHF">CHF</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                            <SelectItem value="CAD">CAD</SelectItem>
                                            <SelectItem value="AUD">AUD</SelectItem>
                                            <SelectItem value="JPY">JPY</SelectItem>
                                            <SelectItem value="CNY">CNY</SelectItem>
                                            <SelectItem value="INR">INR</SelectItem>
                                            <SelectItem value="AED">AED</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
                        {errors.currency && <p className="text-red-500 text-sm">{errors.currency.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="mileage">Mileage</Label>
                        <Input id="mileage" type="number" {...register("mileage", { valueAsNumber: true })} />
                        {errors.mileage && <p className="text-red-500 text-sm">{errors.mileage.message}</p>}
                    </div>
                </div>
            </fieldset>

            {/* Detailed Specs Section */}
            <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Specifications</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="vin">VIN</Label>
                        <Input id="vin" {...register("vin")} />
                        {errors.vin && <p className="text-red-500 text-sm">{errors.vin.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="bodyStyle">Body Style</Label>
                        <Controller
                          name="bodyStyle"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                              <SelectContent>
                                {(carPrefs.data?.bodyStyles || []).map((bs) => (
                                  <SelectItem key={bs} value={bs}>{bs}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.bodyStyle && <p className="text-red-500 text-sm">{errors.bodyStyle.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="engine">Engine</Label>
                        <Input id="engine" placeholder="e.g., 3.0L V6 Twin-Turbo" {...register("engine")} />
                        {errors.engine && <p className="text-red-500 text-sm">{errors.engine.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label>Transmission</Label>
                        <Controller
                            name="transmission"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        {(carPrefs.data?.transmissions || ["Automatic","Manual"]).map((t) => (
                                          <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.transmission && <p className="text-red-500 text-sm">{errors.transmission.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Drivetrain</Label>
                        <Controller
                            name="drivetrain"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        {(carPrefs.data?.drivetrains || ["FWD","RWD","AWD","4WD"]).map((d) => (
                                          <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.drivetrain && <p className="text-red-500 text-sm">{errors.drivetrain.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="exteriorColor">Exterior Color</Label>
                        <Input id="exteriorColor" {...register("exteriorColor")} />
                        {errors.exteriorColor && <p className="text-red-500 text-sm">{errors.exteriorColor.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="interiorColor">Interior Color</Label>
                        <Input id="interiorColor" {...register("interiorColor")} />
                        {errors.interiorColor && <p className="text-red-500 text-sm">{errors.interiorColor.message}</p>}
                    </div>
                </div>
            </fieldset>

            {/* Features Section */}
            <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Features</legend>
                 <Controller
                    name="features"
                    control={control}
                    render={({ field }) => (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {(carPrefs.data?.features || carFeatures).map(feature => (
                                <div key={feature} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={feature}
                                        checked={field.value?.includes(feature)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...(field.value || []), feature])
                                                : field.onChange(field.value?.filter(v => v !== feature))
                                        }}
                                    />
                                    <Label htmlFor={feature} className="font-normal">{feature}</Label>
                                </div>
                            ))}
                        </div>
                    )}
                 />
            </fieldset>
            
            {/* Location & Description */}
            <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Location & Description</legend>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Location</Label>
                  <LocationPicker
                    required
                    initialValue={watch("locationData") as any}
                    onChange={(value) => {
                      setValue("locationData", value as any, { shouldValidate: true });
                      setValue("location", value?.formattedAddress || "", { shouldValidate: true });
                      const c = (value as any)?.components;
                      const line = [c?.streetNumber, c?.route].filter(Boolean).join(" ");
                      if (line) setValue("addressLine", line, { shouldValidate: true });
                      if (c?.locality) setValue("city", c.locality, { shouldValidate: true });
                      if (c?.administrativeAreaLevel1) setValue("region", c.administrativeAreaLevel1, { shouldValidate: true });
                      if (c?.country) setValue("country", c.country, { shouldValidate: true });
                      if (c?.postalCode) setValue("postalCode", c.postalCode, { shouldValidate: true });
                    }}
                  />
                  {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
                  {errors.locationData && <p className="text-red-500 text-sm">{String((errors as any).locationData?.message || "Location selection required")}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Switch id="privacyMode" checked={!!watch("privacyMode")}
                    onCheckedChange={(val) => setValue("privacyMode", !!val)} />
                  <Label htmlFor="privacyMode">Privacy mode</Label>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">If enabled, your exact address will be hidden on the public page. Only your city/state will be shown.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="addressLine">Address</Label>
                    <Input id="addressLine" {...register("addressLine")} />
                    {errors.addressLine && <p className="text-red-500 text-sm">{errors.addressLine.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register("city")} />
                    {errors.city && <p className="text-red-500 text-sm">{errors.city.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region/State</Label>
                    <Input id="region" {...register("region")} />
                    {errors.region && <p className="text-red-500 text-sm">{errors.region.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" {...register("country")} />
                    {errors.country && <p className="text-red-500 text-sm">{errors.country.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">ZIP / Postal Code</Label>
                    <Input id="postalCode" {...register("postalCode")} />
                    {errors.postalCode && <p className="text-red-500 text-sm">{errors.postalCode.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Detailed Description</Label>
                    <Textarea id="description" {...register("description")} rows={6} />
                    {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="conditionDetails">Condition Details</Label>
                    <Textarea id="conditionDetails" {...register("conditionDetails")} rows={4} placeholder="Note any known issues, repairs, modifications, or recent service."/>
                    {errors.conditionDetails && <p className="text-red-500 text-sm">{errors.conditionDetails.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="images">Car Images</Label>
                    {isFreeListing ? (
                      <p className="text-sm text-muted-foreground mb-2">
                        Free promotional listings allow up to 5 car images.
                      </p>
                    ) : selectedTier && (
                      <p className="text-sm text-muted-foreground mb-2">
                        You're only allowed {selectedTier.maxImages} car images because of your {selectedTier.name} type.
                      </p>
                    )}
                     <div className="flex flex-col items-center justify-center w-full">
                        {imagePreviews.length > 0 && (
                          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mb-4 w-full">
                            {imagePreviews.slice(0, getMaxImages()).map((src, idx) => (
                              <div key={idx} className="relative group">
                                <img src={src} alt={`Preview ${idx + 1}`} className="rounded-md object-cover w-20 h-20 sm:w-24 sm:h-24 border shadow-sm transition-transform group-hover:scale-105" />
                                <button
                                  type="button"
                                  className="absolute top-1 right-1 bg-white/80 hover:bg-red-500 hover:text-white text-gray-700 rounded-full p-1 shadow-md transition-colors"
                                  onClick={() => {
                                    const newImages = images.filter((_, i) => i !== idx);
                                    const newPreviews = imagePreviews.filter((_, i) => i !== idx);
                                    setImages(newImages);
                                    setImagePreviews(newPreviews);
                                  }}
                                  aria-label="Remove image"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <label htmlFor="images" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">
                                  {isFreeListing 
                                    ? "Upload up to 5 high-quality images (Free Promotional Listing)"
                                    : selectedTier 
                                      ? `Upload up to ${selectedTier.maxImages} high-quality images (${selectedTier.name})`
                                      : "Please select a listing type first"
                                  }
                                </p>
                            </div>
                            <Input
                              id="images"
                              type="file"
                              className="hidden"
                              multiple
                              accept="image/*"
                              disabled={!isFreeListing && !selectedTier}
                              onChange={e => {
                                let files = e.target.files ? Array.from(e.target.files) : [];
                                if (images.length + files.length > getMaxImages()) {
                                  files = files.slice(0, getMaxImages() - images.length);
                                }
                                const newPreviews = files.map(file => URL.createObjectURL(file));
                                setImages(prev => [...prev, ...files]);
                                setImagePreviews(prev => [...prev, ...newPreviews]);
                              }}
                            />
                        </label>
                    </div>
                    {errors.images && <p className="text-red-500 text-sm">{errors.images.message as string}</p>}
                </div>

                {/* Video Upload Section */}
                {isVideoAllowed() && (
                  <div className="space-y-2">
                    <Label htmlFor="video">Professional Video or Virtual Tour (Optional)</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload a professional video or virtual tour of your car. Maximum file size: 500MB. Supported formats: MP4, MOV, AVI, WMV.
                    </p>
                    <div className="flex flex-col items-center justify-center w-full">
                      {videoPreview && (
                        <div className="mb-4 w-full max-w-md">
                          <video 
                            src={videoPreview} 
                            controls 
                            className="w-full rounded-md border shadow-sm"
                            preload="metadata"
                          />
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-muted-foreground">
                              {video?.name} ({video?.size ? (video.size / (1024 * 1024)).toFixed(2) : '0'} MB)
                            </span>
                            <button
                              type="button"
                              className="text-red-500 hover:text-red-700 text-sm"
                              onClick={() => {
                                setVideo(null);
                                if (videoPreview) {
                                  URL.revokeObjectURL(videoPreview);
                                  setVideoPreview(null);
                                }
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                      {videoUploadProgress > 0 && videoUploadProgress < 100 && (
                        <div className="w-full max-w-md mb-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${videoUploadProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Uploading video: {videoUploadProgress.toFixed(1)}%
                          </p>
                        </div>
                      )}
                      {!videoPreview && (
                        <label htmlFor="video" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="mb-1 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                              MP4, MOV, AVI, WMV up to 500MB
                            </p>
                          </div>
                          <Input
                            id="video"
                            type="file"
                            className="hidden"
                            accept="video/mp4,video/mov,video/avi,video/wmv"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Check file size (500MB = 500 * 1024 * 1024 bytes)
                                const maxSize = 500 * 1024 * 1024;
                                if (file.size > maxSize) {
                                  alert("Video file size must be less than 500MB");
                                  return;
                                }
                                
                                // Check file type
                                const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/wmv'];
                                if (!allowedTypes.includes(file.type)) {
                                  alert("Please upload a valid video file (MP4, MOV, AVI, WMV)");
                                  return;
                                }
                                
                                setVideo(file);
                                const previewUrl = URL.createObjectURL(file);
                                setVideoPreview(previewUrl);
                                setValue("video", file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}
            </fieldset>

             {/* Seller Info */}
            <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Seller Information</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="sellerName">Your Name</Label>
                        <Input id="sellerName" {...register("sellerName")} />
                        {errors.sellerName && <p className="text-red-500 text-sm">{errors.sellerName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sellerContact">Your Contact Email</Label>
                        <Input id="sellerContact" type="email" {...register("sellerContact")} />
                        {errors.sellerContact && <p className="text-red-500 text-sm">{errors.sellerContact.message}</p>}
                    </div>
                </div>
            </fieldset>

            <div className="pt-2">
              <ConsentCheckbox control={control} />
              {errors.mediaConsent && (
                <p className="text-red-500 text-sm mt-1">{String(errors.mediaConsent.message)}</p>
              )}
            </div>
            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing your listing...</span>
                </div>
              ) : (
                "Submit Listing for Approval"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payment Modal for Buying Credits */}
      <Dialog open={creditPaymentModal.open} onOpenChange={(open) => {
        if (!open) {
          setCreditPaymentModal({ open: false, tierKey: null });
          setCreditPaymentStep('selectTier');
          setCreditSelectedTier(null);
          setCreditSelectedPayment(null);
          setCreditStripeClientSecret(null);
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
                    toast({
                      title: "Payment Method Error",
                      description: "Please select a payment method to continue.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setCreditProcessing(true);
                  setCreditPaymentError(null);
                  let amount = creditSelectedTier.priceEUR;
                  if (creditSelectedTier?.key === 'basicListing') amount = getPrice('cars.basic', amount);
                  if (creditSelectedTier?.key === 'enhancedListing') amount = getPrice('cars.enhanced', amount);
                  if (creditSelectedTier?.key === 'premiumListing') amount = getPrice('cars.premium', amount);
                  if (creditSelectedTier?.key === 'exclusiveBanner') amount = getPrice('cars.exclusiveBanner', amount);
                  const finalAmount = Math.max(0, amount - (couponDiscount || 0));
                  const description = creditSelectedTier.name;
                  if (creditSelectedPayment === 'stripe') {
                    const res = await fetch('/api/payment/stripe-checkout-session', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ amount: finalAmount, description, email: currentUser?.email, couponCode: couponCode || undefined, category: 'cars' }),
                    });
                    const data = await res.json();
                    if (data.clientSecret) {
                      setCreditStripeClientSecret(data.clientSecret);
                      setCreditPaymentStep('pay');
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
              <div className="flex items-center gap-2">
                <Input placeholder="Coupon code (optional)" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!creditSelectedTier) return;
                    let amt = creditSelectedTier.priceEUR;
                    if (creditSelectedTier?.key === 'basicListing') amt = getPrice('cars.basic', amt);
                    if (creditSelectedTier?.key === 'enhancedListing') amt = getPrice('cars.enhanced', amt);
                    if (creditSelectedTier?.key === 'premiumListing') amt = getPrice('cars.premium', amt);
                    if (creditSelectedTier?.key === 'exclusiveBanner') amt = getPrice('cars.exclusiveBanner', amt);
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
            </div>
          )}
          {/* Step 3: Payment form */}
          {creditPaymentStep === 'pay' && creditSelectedTier && (
            <div className="flex flex-col gap-4 py-4">
              {creditSelectedPayment === 'stripe' ? (
                <Elements stripe={stripePromise} options={creditStripeClientSecret ? { clientSecret: creditStripeClientSecret } : {}}>
                  <CreditCheckoutForm
                    onSuccess={async () => {
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
                      // If user initiated selection for this tier, apply it now
                      if (pendingListingSelection === creditSelectedTier.key) {
                        setSelectedListingType(creditSelectedTier.key);
                        setPendingListingSelection(null);
                      }
                      setCreditPaymentModal({ open: false, tierKey: null });
                      setCreditPaymentStep('selectTier');
                      setCreditSelectedTier(null);
                      setCreditSelectedPayment(null);
                      setCreditStripeClientSecret(null);
                      setCreditPaymentError(null);
                      toast({
                        title: "Credit Purchase Successful",
                        description: `You have successfully purchased 1 credit for ${creditSelectedTier.name}.`,
                      });
                    }}
                    onError={(msg) => {
                      setCreditPaymentError(msg);
                      toast({
                        title: "Credit Purchase Failed",
                        description: msg,
                        variant: "destructive",
                      });
                    }}
                    processing={creditProcessing}
                    clientSecret={creditStripeClientSecret!}
                  />
                </Elements>
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
                            // If user initiated selection for this tier, apply it now
                            if (pendingListingSelection === creditSelectedTier.key) {
                              setSelectedListingType(creditSelectedTier.key);
                              setPendingListingSelection(null);
                            }
                            setCreditPaymentModal({ open: false, tierKey: null });
                            setCreditPaymentStep('selectTier');
                            setCreditSelectedTier(null);
                            setCreditSelectedPayment(null);
                            setCreditStripeClientSecret(null);
                            setCreditPaymentError(null);
                            toast({
                              title: "Credit Purchase Successful",
                              description: `You have successfully purchased 1 credit for ${creditSelectedTier.name}.`,
                              variant: "default",
                            });
                            return Promise.resolve();
                          } else {
                            throw new Error(captureData.error || 'Payment capture failed');
                          }
                        } catch (error: any) {
                          setCreditPaymentError(error.message || 'Payment failed');
                          toast({
                            title: "Credit Purchase Failed",
                            description: error.message || 'Payment failed',
                            variant: "destructive",
                          });
                          return Promise.reject(error);
                        }
                      }}
                      onError={(err: any) => {
                        setCreditPaymentError('PayPal error: ' + (err?.message || 'Unknown error'));
                        toast({
                          title: "Credit Purchase Failed",
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
    </div>
  );
}

// Add CreditCheckoutForm component for Stripe
function CreditCheckoutForm({ onSuccess, onError, processing, clientSecret }: { onSuccess: () => void, onError: (msg: string) => void, processing: boolean, clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
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
