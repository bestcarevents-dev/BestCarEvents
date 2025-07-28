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

const carFeatures = ["Air Conditioning", "Power Steering", "Power Windows", "Sunroof/Moonroof", "Navigation System", "Bluetooth", "Backup Camera", "Leather Seats", "Heated Seats"] as const;

// Car listing tiers from advertise page
const CAR_LISTING_TIERS = [
  {
    name: "Basic Listing",
    key: "basicListing",
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
    icon: Crown,
    features: [
      "Prominently featured on homepage banner",
      "Featured across key categories",
      "Professional video or virtual tour",
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
  price: z.number().positive("Price must be positive"),
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

  const { control, register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CarFormData>({
    resolver: zodResolver(carSchema),
    defaultValues: {
        features: [],
    }
  });

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
      const imageUrls = [];
      const files = images;

      if (files.length === 0) {
          setIsSubmitting(false);
          return;
      }

      // Upload images
      for (const file of Array.from(files)) {
        const imageRef = ref(storage, `car_images/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      }

      // Upload video if provided and allowed
      let videoUrl = null;
      if (video && isVideoAllowed()) {
        const videoRef = ref(storage, `car_videos/${Date.now()}_${video.name}`);
        
        // Create upload task for progress tracking
        const uploadTask = uploadBytesResumable(videoRef, video);
        
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
      }

      // Add car to database
      await addDoc(collection(db, "pendingCars"), {
        ...data,
        images: imageUrls,
        videoUrl: videoUrl,
        listing_type: isFreeListing ? "free" : selectedListingType,
        status: "pending",
        submittedAt: new Date(),
        uploadedByUserId: currentUser?.uid || null,
        uploadedByUserEmail: currentUser?.email || null,
      });

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

      router.push("/cars/submission-success");
    } catch (error) {
      console.error("Error submitting car:", error);
      setIsSubmitting(false);
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
                Cars listing for the first month after launch is <span className="font-bold text-primary">FREE</span>!
              </p>
              <p className="text-sm text-muted-foreground">
                You can submit your car for approval with up to 5 images at no cost.
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
                  <Button asChild variant="outline">
                    <Link href="/advertise/cars">Buy More Credit</Link>
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
                      } ${!hasQuota ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => hasQuota && setSelectedListingType(tier.key)}
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
                        <p className="text-xs text-red-500">No Credit available</p>
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
                        <Label htmlFor="price">Price (USD)</Label>
                        <Input id="price" type="number" {...register("price", { valueAsNumber: true })} />
                        {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
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
                        <Input id="bodyStyle" placeholder="e.g., Coupe, Sedan, SUV" {...register("bodyStyle")} />
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
                                        <SelectItem value="Automatic">Automatic</SelectItem>
                                        <SelectItem value="Manual">Manual</SelectItem>
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
                                        <SelectItem value="FWD">FWD</SelectItem>
                                        <SelectItem value="RWD">RWD</SelectItem>
                                        <SelectItem value="AWD">AWD</SelectItem>
                                        <SelectItem value="4WD">4WD</SelectItem>
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
                            {carFeatures.map(feature => (
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
            
            {/* Description and Media */}
            <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Description & Media</legend>
                 <div className="space-y-2">
                    <Label htmlFor="location">Location (City, State/Country)</Label>
                    <Input id="location" {...register("location")} />
                    {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
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

            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Listing for Approval"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
