"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFirestore, collection, addDoc } from "firebase/firestore";
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
import { UploadCloud, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const hotelFeatures = ["Climate Controlled", "24/7 Security", "Detailing Services", "Member's Lounge", "Battery Tending", "Transportation", "24/7 Access", "Social Events", "Sales & Brokerage"] as const;

const hotelSchema = z.object({
  hotelName: z.string().min(3, "Hotel name is required"),
  
  // Location
  address: z.string().min(10, "A detailed address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State/Province is required"),
  country: z.string().min(2, "Country is required"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  
  // Details
  description: z.string().min(20, "A detailed description of the facility is required"),
  storageType: z.enum(["Dedicated", "Collection", "Long-Term", "Short-Term"]),
  
  // Features
  features: z.array(z.string()).optional(),
  
  // Organizer Info
  contactName: z.string().min(3, "Contact name is required"),
  contactEmail: z.string().email("Invalid email address"),
  
  // Media
  images: z
    .array(z.any())
    .refine(
      files => typeof window === "undefined" || (Array.isArray(files) && files.length > 0 && files.every(file => file instanceof File)),
      "At least one image is required"
    ),
});

type HotelFormData = z.infer<typeof hotelSchema>;

export default function ListHotelPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();
  const db = getFirestore(app);
  const storage = getStorage(app);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState("");
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const MAX_IMAGES = 10;

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<HotelFormData>({
    resolver: zodResolver(hotelSchema),
    defaultValues: {
      features: [],
      images: [],
    }
  });

  // Sync images with react-hook-form
  useEffect(() => {
    setValue("images", images);
  }, [images, setValue]);

  // Get current user
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Handle image preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const newFiles = files.filter(f => !images.some(img => img.name === f.name && img.size === f.size));
    setImages(prev => [...prev, ...newFiles].slice(0, MAX_IMAGES));
    setImagePreviews(prev => [
      ...prev,
      ...newFiles.map(file => URL.createObjectURL(file))
    ].slice(0, MAX_IMAGES));
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Handle custom amenities
  const addCustomAmenity = () => {
    if (customAmenity.trim() && !customAmenities.includes(customAmenity.trim())) {
      setCustomAmenities(prev => [...prev, customAmenity.trim()]);
      setCustomAmenity("");
    }
  };
  const removeCustomAmenity = (amenity: string) => {
    setCustomAmenities(prev => prev.filter(a => a !== amenity));
  };

  const onSubmit = async (data: HotelFormData) => {
    setIsSubmitting(true);
    try {
      // Upload all images
      const imageUrls = [];
      for (const file of images) {
        const imageRef = ref(storage, `hotel_images/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      }
      await addDoc(collection(db, "pendingHotels"), {
        hotelName: data.hotelName,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        website: data.website,
        description: data.description,
        storageType: data.storageType,
        features: [...(data.features || []), ...customAmenities],
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        imageUrls,
        status: "pending",
        submittedAt: new Date(),
        uploadedByUserId: currentUser?.uid || null,
        uploadedByUserEmail: currentUser?.email || null,
      });
      router.push("/hotels/submission-success");
    } catch (error) {
      console.error("Error submitting hotel:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline text-primary">List Your Car Hotel or Storage Facility</CardTitle>
          <CardDescription>Provide detailed information about your facility for our team to review.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Facility Information</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="hotelName">Facility Name</Label>
                      <Input id="hotelName" {...register("hotelName")} />
                      {errors.hotelName && <p className="text-red-500 text-sm">{errors.hotelName.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label>Primary Storage Type</Label>
                        <Controller name="storageType" control={control} render={({ field }) => (
                            <select {...field} className="w-full p-2 border rounded-md bg-background text-foreground dark:bg-zinc-900 dark:text-white">
                              <option value="Dedicated">Dedicated</option>
                              <option value="Collection">Collection</option>
                              <option value="Long-Term">Long-Term</option>
                              <option value="Short-Term">Short-Term</option>
                            </select>
                        )} />
                        {errors.storageType && <p className="text-red-500 text-sm">{errors.storageType.message}</p>}
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="description">Detailed Description</Label>
                    <Textarea id="description" {...register("description")} rows={5} />
                    {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                 </div>
            </fieldset>

            <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Location & Contact</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="address">Street Address</Label>
                        <Input id="address" {...register("address")} />
                        {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" {...register("city")} />
                        {errors.city && <p className="text-red-500 text-sm">{errors.city.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="state">State/Province</Label>
                        <Input id="state" {...register("state")} />
                        {errors.state && <p className="text-red-500 text-sm">{errors.state.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" {...register("country")} />
                        {errors.country && <p className="text-red-500 text-sm">{errors.country.message}</p>}
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="website">Website URL <span className="text-muted-foreground">(optional)</span></Label>
                    <Input id="website" {...register("website")} placeholder="https://example.com" />
                    {errors.website && <p className="text-red-500 text-sm">{errors.website.message}</p>}
                </div>
            </fieldset>

            <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Features & Amenities</legend>
                <Controller
                    name="features"
                    control={control}
                    render={({ field }) => (
                        <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            {hotelFeatures.map(feature => (
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
                        <div className="flex flex-wrap gap-2 mb-2">
                          {customAmenities.map(amenity => (
                            <div key={amenity} className="flex items-center bg-muted px-3 py-1 rounded-full">
                              <Checkbox
                                id={amenity}
                                checked={field.value?.includes(amenity)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), amenity])
                                    : field.onChange(field.value?.filter(v => v !== amenity))
                                }}
                              />
                              <Label htmlFor={amenity} className="font-normal ml-2 mr-1">{amenity}</Label>
                              <button type="button" onClick={() => removeCustomAmenity(amenity)} className="ml-1 text-destructive hover:text-red-600"><X className="w-4 h-4" /></button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 mb-2">
                          <Input
                            type="text"
                            value={customAmenity}
                            onChange={e => setCustomAmenity(e.target.value)}
                            placeholder="Add custom amenity"
                            className="w-64"
                          />
                          <Button type="button" onClick={addCustomAmenity} variant="secondary">Add</Button>
                        </div>
                        </>
                    )}
                 />
            </fieldset>

             <fieldset className="space-y-6 border-t pt-6">
                 <legend className="text-xl font-semibold font-headline">Media & Contact</legend>
                 <div className="space-y-2">
                    <Label htmlFor="image">Facility Images</Label>
                     <div className="flex flex-col items-center justify-center w-full">
                        <label htmlFor="image" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            </div>
                            <Input id="image" type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
                        </label>
                        <div className="flex flex-wrap gap-4 mt-4">
                          {imagePreviews.map((src, idx) => (
                            <div key={src} className="relative group">
                              <img src={src} alt={`Preview ${idx + 1}`} className="w-32 h-24 object-cover rounded shadow" />
                              <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-destructive hover:text-red-600 shadow"><X className="w-4 h-4" /></button>
                            </div>
                          ))}
                        </div>
                     </div>
                    {errors.images && <p className="text-red-500 text-sm">{errors.images.message as string}</p>}
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="contactName">Your Name</Label>
                        <Input id="contactName" {...register("contactName")} />
                        {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contactEmail">Your Contact Email</Label>
                        <Input id="contactEmail" type="email" {...register("contactEmail")} />
                        {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail.message}</p>}
                    </div>
                </div>
            </fieldset>

            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Facility for Approval"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
