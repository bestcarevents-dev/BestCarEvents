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
import { createHotelRequestNotification } from "@/lib/notifications";
import LocationPicker, { type LocationData } from "@/components/LocationPicker";
import { Switch } from "@/components/ui/switch";
import { useFormPreferences } from "@/hooks/useFormPreferences";

const hotelFeatures = ["Climate Controlled", "24/7 Security", "Detailing Services", "Member's Lounge", "Battery Tending", "Transportation", "24/7 Access", "Social Events", "Sales & Brokerage"] as const;

const hotelSchema = z.object({
  hotelName: z.string().min(3, "Hotel name is required"),
  
  // Location
  address: z.string().min(10, "A detailed address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State/Province is required"),
  country: z.string().min(2, "Country is required"),
  postalCode: z.string().min(1, "ZIP/Postal code is required"),
  locationData: z.custom<LocationData>((v) => !!v && typeof v === 'object').refine((v: any) => v?.formattedAddress && typeof v.latitude === 'number' && typeof v.longitude === 'number', {
    message: "Please select a valid location from suggestions or map",
  }),
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
  privacyMode: z.boolean().optional().default(false),
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

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<HotelFormData>({
    resolver: zodResolver(hotelSchema),
    defaultValues: {
      features: [],
      images: [],
      privacyMode: false,
    }
  });
  const hotelPrefs = useFormPreferences("hotels");

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
      
      const hotelData = {
        hotelName: data.hotelName,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: (data as any).postalCode,
        locationData: (data as any).locationData,
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
        privacyMode: !!(data as any).privacyMode,
      };

      const docRef = await addDoc(collection(db, "pendingHotels"), hotelData);
      
      // Create notification (non-blocking)
      try {
        await createHotelRequestNotification({
          ...hotelData,
          id: docRef.id,
          userId: currentUser?.uid || null
        });
      } catch (notificationError) {
        console.error('Error creating hotel notification:', notificationError);
        // Don't fail the submission if notification fails
      }

      router.push("/hotels/submission-success");
    } catch (error) {
      console.error("Error submitting hotel:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-4xl mx-auto bg-white border border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-3xl font-bold font-headline text-gray-900">List Your Car Hotel or Storage Facility</CardTitle>
            <CardDescription className="text-gray-600">Provide detailed information about your facility for our team to review.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              
              <fieldset className="space-y-6 border-t border-gray-200 pt-6">
                  <legend className="text-xl font-semibold font-headline text-gray-900">Facility Information</legend>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="hotelName" className="text-gray-700 font-medium">Facility Name</Label>
                        <Input id="hotelName" {...register("hotelName")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                        {errors.hotelName && <p className="text-red-500 text-sm">{errors.hotelName.message}</p>}
                      </div>
                       <div className="space-y-2">
                          <Label className="text-gray-700 font-medium">Primary Storage Type</Label>
                          <Controller name="storageType" control={control} render={({ field }) => (
                              <select {...field} className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:border-yellow-400 focus:ring-yellow-400">
                                {(hotelPrefs.data?.storageTypes || ["Dedicated","Collection","Long-Term","Short-Term"]).map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                          )} />
                          {errors.storageType && <p className="text-red-500 text-sm">{errors.storageType.message}</p>}
                      </div>
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="description" className="text-gray-700 font-medium">Detailed Description</Label>
                      <Textarea id="description" {...register("description")} rows={5} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                      {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                   </div>
              </fieldset>

              <fieldset className="space-y-6 border-t border-gray-200 pt-6">
                  <legend className="text-xl font-semibold font-headline text-gray-900">Location & Contact</legend>
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Location</Label>
                    <LocationPicker
                      required
                      initialValue={watch("locationData") as any}
                      onChange={(value) => {
                        setValue("locationData", value as any, { shouldValidate: true });
                        const c = (value as any)?.components;
                        const line = [c?.streetNumber, c?.route].filter(Boolean).join(" ");
                        if (line) setValue("address", line, { shouldValidate: true });
                        if (c?.locality) setValue("city", c.locality, { shouldValidate: true });
                        if (c?.administrativeAreaLevel1) setValue("state", c.administrativeAreaLevel1, { shouldValidate: true });
                        if (c?.country) setValue("country", c.country, { shouldValidate: true });
                        if (c?.postalCode) setValue("postalCode", c.postalCode, { shouldValidate: true });
                      }}
                    />
                    {errors.locationData && <p className="text-red-500 text-sm">{String((errors as any).locationData?.message || "Location selection required")}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch id="privacyMode" checked={!!watch("privacyMode")}
                      onCheckedChange={(val) => setValue("privacyMode", !!val)} />
                    <Label htmlFor="privacyMode" className="text-gray-700">Privacy mode</Label>
                  </div>
                  <p className="text-xs text-gray-500 -mt-2">If enabled, your exact address will be hidden on the public page. Only your city/state will be shown.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <Label htmlFor="address" className="text-gray-700 font-medium">Street Address</Label>
                          <Input id="address" {...register("address")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                          {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="city" className="text-gray-700 font-medium">City</Label>
                          <Input id="city" {...register("city")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                          {errors.city && <p className="text-red-500 text-sm">{errors.city.message}</p>}
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="state" className="text-gray-700 font-medium">State/Province</Label>
                          <Input id="state" {...register("state")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                          {errors.state && <p className="text-red-500 text-sm">{errors.state.message}</p>}
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="country" className="text-gray-700 font-medium">Country</Label>
                          <Input id="country" {...register("country")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                          {errors.country && <p className="text-red-500 text-sm">{errors.country.message}</p>}
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="postalCode" className="text-gray-700 font-medium">ZIP / Postal Code</Label>
                          <Input id="postalCode" {...register("postalCode")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                          {errors.postalCode && <p className="text-red-500 text-sm">{errors.postalCode.message}</p>}
                      </div>
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="website" className="text-gray-700 font-medium">Website URL <span className="text-gray-500">(optional)</span></Label>
                      <Input id="website" {...register("website")} placeholder="https://example.com" className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                      {errors.website && <p className="text-red-500 text-sm">{errors.website.message}</p>}
                  </div>
              </fieldset>

              <fieldset className="space-y-6 border-t border-gray-200 pt-6">
                  <legend className="text-xl font-semibold font-headline text-gray-900">Features & Amenities</legend>
                  <Controller
                      name="features"
                      control={control}
                      render={({ field }) => (
                          <>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                              {(hotelPrefs.data?.features || hotelFeatures).map(feature => (
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
                                      <Label htmlFor={feature} className="font-normal text-gray-700">{feature}</Label>
                                  </div>
                              ))}
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {customAmenities.map(amenity => (
                              <div key={amenity} className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                                <Checkbox
                                  id={amenity}
                                  checked={field.value?.includes(amenity)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), amenity])
                                      : field.onChange(field.value?.filter(v => v !== amenity))
                                  }}
                                />
                                <Label htmlFor={amenity} className="font-normal ml-2 mr-1 text-gray-700">{amenity}</Label>
                                <button type="button" onClick={() => removeCustomAmenity(amenity)} className="ml-1 text-red hover:text-red-600"><X className="w-4 h-4" /></button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 mb-2">
                            <Input
                              type="text"
                              value={customAmenity}
                              onChange={e => setCustomAmenity(e.target.value)}
                              placeholder="Add custom amenity"
                              className="w-64 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
                            />
                            <Button type="button" onClick={addCustomAmenity} variant="secondary" className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200">Add</Button>
                          </div>
                          </>
                      )}
                   />
              </fieldset>

               <fieldset className="space-y-6 border-t border-gray-200 pt-6">
                   <legend className="text-xl font-semibold font-headline text-gray-900">Media & Contact</legend>
                   <div className="space-y-2">
                      <Label htmlFor="image" className="text-gray-700 font-medium">Facility Images</Label>
                       <div className="flex flex-col items-center justify-center w-full">
                          <label htmlFor="image" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                                  <p className="mb-2 text-sm text-gray-600"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                              </div>
                              <Input id="image" type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
                          </label>
                          <div className="flex flex-wrap gap-4 mt-4">
                            {imagePreviews.map((src, idx) => (
                              <div key={src} className="relative group">
                                <img src={src} alt={`Preview ${idx + 1}`} className="w-32 h-24 object-cover rounded shadow border border-gray-200" />
                                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-red hover:text-red-600 shadow"><X className="w-4 h-4" /></button>
                              </div>
                            ))}
                          </div>
                       </div>
                      {errors.images && <p className="text-red-500 text-sm">{errors.images.message as string}</p>}
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <Label htmlFor="contactName" className="text-gray-700 font-medium">Your Name</Label>
                          <Input id="contactName" {...register("contactName")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                          {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName.message}</p>}
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="contactEmail" className="text-gray-700 font-medium">Your Contact Email</Label>
                          <Input id="contactEmail" type="email" {...register("contactEmail")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                          {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail.message}</p>}
                      </div>
                  </div>
              </fieldset>

              <Button type="submit" className="w-full text-lg py-6 bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600 focus:ring-yellow-400" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Facility for Approval"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
