"use client";

import { useState, useEffect, useRef } from "react";
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
import { UploadCloud, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from "react";
import { createAuctionRequestNotification } from "@/lib/notifications";
import ConsentCheckbox from "@/components/form/ConsentCheckbox";
import LocationPicker, { type LocationData } from "@/components/LocationPicker";
import { Switch } from "@/components/ui/switch";
import TagInput from "@/components/form/TagInput";

const auctionSchema = z.object({
  auctionName: z.string().min(5, "Auction name is required"),
  auctionHouse: z.string().min(2, "Auction house name is required"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  
  // Location
  location: z.string().min(2, "Location is required"),
  locationData: z.custom<LocationData>((v) => !!v && typeof v === 'object').refine((v: any) => v?.formattedAddress && typeof v.latitude === 'number' && typeof v.longitude === 'number', {
    message: "Please select a valid location from suggestions or map",
  }),
  address: z.string().min(2, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "ZIP/Postal code is required"),
  privacyMode: z.boolean().optional().default(false),
  
  // Details
  description: z.string().min(20, "A detailed description of the auction event is required"),
  auctionType: z.string().min(1, "Auction type is required"),
  viewingTimes: z.string().optional(),

  // Organizer Info
  organizerName: z.string().min(3, "Organizer name is required"),
  organizerContact: z.string().email("Invalid email address"),
  
  // Media
  image: z
    .any()
    .refine(
      (file) => typeof window === "undefined" || (file instanceof File && file.size > 0),
      "An image of the venue or a poster is required"
    ),
  mediaConsent: z
    .boolean()
    .refine((val) => val === true, {
      message: "You must confirm you have required consent and rights",
    }),
});

type AuctionFormData = z.infer<typeof auctionSchema>;

export default function RegisterAuctionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();
  const db = getFirestore(app);
  const storage = getStorage(app);

  const { control, register, handleSubmit, formState: { errors }, setValue, watch, setFocus } = useForm<AuctionFormData>({
    resolver: zodResolver(auctionSchema),
    defaultValues: { mediaConsent: false, privacyMode: false },
  });
  const locationSectionRef = useRef<HTMLDivElement | null>(null);
  const onInvalid = (errs: any) => {
    if (errs?.location || errs?.locationData) {
      locationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const firstKey = Object.keys(errs || {})[0];
    if (firstKey) {
      try { setFocus(firstKey as any); } catch {}
    }
  };

  // Watch for image changes to update preview
  const imageFile = watch("image");

  // Update preview when image changes
  React.useEffect(() => {
    if (imageFile && imageFile instanceof File) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  // Get current user
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const onSubmit = async (data: AuctionFormData) => {
    setIsSubmitting(true);
    try {
      const imageRef = ref(storage, `auction_venues/${Date.now()}_${data.image.name}`);
      await uploadBytes(imageRef, data.image);
      const imageUrl = await getDownloadURL(imageRef);

      const auctionData = {
        auctionName: data.auctionName,
        auctionHouse: data.auctionHouse,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location,
        locationData: (data as any).locationData,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: (data as any).postalCode,
        description: data.description,
        auctionType: data.auctionType,
        viewingTimes: data.viewingTimes,
        organizerName: data.organizerName,
        organizerContact: data.organizerContact,
        imageUrl,
        privacyMode: !!(data as any).privacyMode,
        mediaConsent: !!(data as any).mediaConsent,
        status: "pending",
        submittedAt: new Date(),
        uploadedByUserId: currentUser?.uid || null,
        uploadedByUserEmail: currentUser?.email || null,
      };

      const docRef = await addDoc(collection(db, "pendingAuctions"), auctionData);
      
      // Create notification (non-blocking)
      try {
        await createAuctionRequestNotification({
          ...auctionData,
          id: docRef.id,
          userId: currentUser?.uid || null
        });
      } catch (notificationError) {
        console.error('Error creating auction notification:', notificationError);
        // Don't fail the submission if notification fails
      }

      router.push("/auctions/submission-success");
    } catch (error) {
      console.error("Error submitting auction:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-4xl mx-auto bg-white border border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-3xl font-bold font-headline text-gray-900">Register Your Auction Event</CardTitle>
            <CardDescription className="text-gray-600">Provide details about your upcoming auction for our team to review and list on the platform.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
              
              <fieldset className="space-y-6 border-t border-gray-200 pt-6">
                  <legend className="text-xl font-semibold font-headline text-gray-900">Auction Details</legend>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <Label htmlFor="auctionName" className="text-gray-700 font-medium">Auction Name</Label>
                          <Input id="auctionName" {...register("auctionName")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                          {errors.auctionName && <p className="text-red-500 text-sm">{errors.auctionName.message}</p>}
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="auctionHouse" className="text-gray-700 font-medium">Auction House</Label>
                          <Input id="auctionHouse" {...register("auctionHouse")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                          {errors.auctionHouse && <p className="text-red-500 text-sm">{errors.auctionHouse.message}</p>}
                      </div>
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <Label className="text-gray-700 font-medium">Start Date</Label>
                          <Controller name="startDate" control={control} render={({ field }) => (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button 
                                    variant={"outline"} 
                                    className={cn(
                                      "w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-900 hover:bg-gray-50 focus:border-yellow-400 focus:ring-yellow-400", 
                                      !field.value && "text-gray-500"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-white border border-gray-200 text-gray-900">
                                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                </PopoverContent>
                              </Popover>
                          )} />
                          {errors.startDate && <p className="text-red-500 text-sm">{errors.startDate.message}</p>}
                      </div>
                       <div className="space-y-2">
                          <Label className="text-gray-700 font-medium">End Date</Label>
                          <Controller name="endDate" control={control} render={({ field }) => (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button 
                                    variant={"outline"} 
                                    className={cn(
                                      "w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-900 hover:bg-gray-50 focus:border-yellow-400 focus:ring-yellow-400", 
                                      !field.value && "text-gray-500"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-white border border-gray-200 text-gray-900">
                                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                </PopoverContent>
                              </Popover>
                          )} />
                          {errors.endDate && <p className="text-red-500 text-sm">{errors.endDate.message}</p>}
                      </div>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="description" className="text-gray-700 font-medium">Auction Description</Label>
                      <Textarea id="description" {...register("description")} rows={5} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                      {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                  </div>
              </fieldset>

              <fieldset className="space-y-6 border-t border-gray-200 pt-6">
                  <legend className="text-xl font-semibold font-headline text-gray-900">Location & Venue</legend>
                   <div className="space-y-2" ref={locationSectionRef}>
                      <Label className="text-gray-700 font-medium">Location</Label>
                      <LocationPicker
                        label=""
                        required
                        initialValue={watch("locationData") as any}
                        onChange={(value) => {
                          setValue("locationData", value as any, { shouldValidate: true });
                          setValue("location", value?.formattedAddress || "", { shouldValidate: true });
                          const c = (value as any)?.components;
                          const line = [c?.streetNumber, c?.route].filter(Boolean).join(" ");
                          if (line) setValue("address", line, { shouldValidate: true });
                          if (c?.locality) setValue("city", c.locality, { shouldValidate: true });
                          if (c?.administrativeAreaLevel1) setValue("state", c.administrativeAreaLevel1, { shouldValidate: true });
                          if (c?.country) setValue("country", c.country, { shouldValidate: true });
                          if (c?.postalCode) setValue("postalCode", c.postalCode, { shouldValidate: true });
                        }}
                      />
                      {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
                      {errors.locationData && <p className="text-red-500 text-sm">{String((errors as any).locationData?.message || "Location selection required")}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch id="privacyMode" checked={!!watch("privacyMode")} onCheckedChange={(val) => setValue("privacyMode", !!val)} />
                    <Label htmlFor="privacyMode" className="text-gray-700">Privacy mode</Label>
                  </div>
                  <p className="text-xs text-gray-500 -mt-2">If enabled, your exact address will be hidden on the public page. Only your city/state will be shown.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              </fieldset>

              <fieldset className="space-y-6 border-t border-gray-200 pt-6">
                  <legend className="text-xl font-semibold font-headline text-gray-900">Registration & Logistics</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <Label className="text-gray-700 font-medium">Auction Type(s)</Label>
                          <Controller
                            name="auctionType"
                            control={control}
                            render={({ field }) => (
                              <TagInput
                                value={field.value as unknown as string}
                                onChange={field.onChange}
                                placeholder="e.g., Online, In-Person, Hybrid or custom"
                                helperText="Type a value and press Enter to add multiple types."
                              />
                            )}
                          />
                          {errors.auctionType && <p className="text-red-500 text-sm">{errors.auctionType.message}</p>}
                      </div>
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="viewingTimes" className="text-gray-700 font-medium">Public Viewing Times</Label>
                      <Textarea id="viewingTimes" {...register("viewingTimes")} rows={3} placeholder="e.g., Friday, Oct 25: 10am - 6pm&#10;Saturday, Oct 26: 9am - 1pm" className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"/>
                      {errors.viewingTimes && <p className="text-red-500 text-sm">{errors.viewingTimes.message}</p>}
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="image" className="text-gray-700 font-medium">Venue Image or Event Poster</Label>
                       <div className="flex flex-col items-center justify-center w-full">
                          <label htmlFor="image" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors relative">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                                  <p className="mb-2 text-sm text-gray-600"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                              </div>
                              <Controller name="image" control={control} render={({ field }) => <Input id="image" type="file" className="hidden" accept="image/*" onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} />} />
                              {imagePreview && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg">
                                  <img src={imagePreview} alt="Preview" className="max-h-40 max-w-full rounded shadow mb-2" />
                                  <Button type="button" size="sm" variant="destructive" onClick={() => { setValue("image", null); setImagePreview(null); }}>Remove</Button>
                                </div>
                              )}
                          </label>
                      </div>
                      {errors.image && <p className="text-red-500 text-sm">{errors.image.message as string}</p>}
                  </div>
              </fieldset>

               <fieldset className="space-y-6 border-t border-gray-200 pt-6">
                  <legend className="text-xl font-semibold font-headline text-gray-900">Organizer Information</legend>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <Label htmlFor="organizerName" className="text-gray-700 font-medium">Your Name</Label>
                          <Input id="organizerName" {...register("organizerName")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                          {errors.organizerName && <p className="text-red-500 text-sm">{errors.organizerName.message}</p>}
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="organizerContact" className="text-gray-700 font-medium">Your Contact Email</Label>
                          <Input id="organizerContact" type="email" {...register("organizerContact")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                          {errors.organizerContact && <p className="text-red-500 text-sm">{errors.organizerContact.message}</p>}
                      </div>
                  </div>
              </fieldset>

              <div className="pt-2">
                <ConsentCheckbox control={control} />
                {errors.mediaConsent && (
                  <p className="text-red-500 text-sm mt-1">{String(errors.mediaConsent.message)}</p>
                )}
              </div>
              <Button type="submit" className="w-full text-lg py-6 bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600 focus:ring-yellow-400" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Auction for Approval"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
