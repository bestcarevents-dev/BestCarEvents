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
import { UploadCloud, X } from "lucide-react";
import { createClubRequestNotification } from "@/lib/notifications";
import ConsentCheckbox from "@/components/form/ConsentCheckbox";
import LocationPicker, { type LocationData } from "@/components/LocationPicker";
import { Switch } from "@/components/ui/switch";

const clubSchema = z.object({
  clubName: z.string().min(3, "Club name is required"),
  
  // Location and Contact
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
  website: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  socialMediaLink: z.string().url("Must be a valid URL").optional().or(z.literal('')),

  // Details
  description: z.string().min(20, "A detailed description of the club is required"),
  membershipCriteria: z.string().min(10, "Membership criteria is required"),
  typicalActivities: z.string().min(10, "Please list some typical activities"),
  
  // Organizer Info
  contactName: z.string().min(3, "Contact name is required"),
  contactEmail: z.string().email("Invalid email address"),
  
  // Media
  logo: z
    .any()
    .refine(
      (file) => typeof window === "undefined" || (file instanceof File && file.size > 0),
      "A club logo is required"
    ),
  mediaConsent: z
    .boolean()
    .refine((val) => val === true, {
      message: "You must confirm you have required consent and rights",
    }),
});

type ClubFormData = z.infer<typeof clubSchema>;

export default function RegisterClubPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const router = useRouter();
  const db = getFirestore(app);
  const storage = getStorage(app);

  const { register, handleSubmit, control, setValue, formState: { errors }, watch, setFocus } = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
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

  // Get current user
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Handle logo preview
  const handleLogoChange = (file: File | null) => {
    setLogoFile(file);
    setValue("logo", file as any); // update react-hook-form
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    } else {
      setLogoPreview(null);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setValue("logo", null as any);
  };

  const onSubmit = async (data: ClubFormData) => {
    setIsSubmitting(true);
    try {
      const logoRef = ref(storage, `club_logos/${Date.now()}_${data.logo.name}`);
      await uploadBytes(logoRef, data.logo);
      const logoUrl = await getDownloadURL(logoRef);

      const clubData = {
        clubName: data.clubName,
        location: data.location,
        locationData: (data as any).locationData,
        addressLine: (data as any).addressLine,
        city: data.city,
        region: (data as any).region,
        country: data.country,
        postalCode: (data as any).postalCode,
        privacyMode: !!(data as any).privacyMode,
        website: data.website,
        socialMediaLink: data.socialMediaLink,
        description: data.description,
        membershipCriteria: data.membershipCriteria,
        typicalActivities: data.typicalActivities,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        logoUrl,
        mediaConsent: !!(data as any).mediaConsent,
        status: "pending",
        submittedAt: new Date(),
        uploadedByUserId: currentUser?.uid || null,
        uploadedByUserEmail: currentUser?.email || null,
      };

      const docRef = await addDoc(collection(db, "pendingClubs"), clubData);
      
      // Create notification (non-blocking)
      try {
        await createClubRequestNotification({
          ...clubData,
          id: docRef.id,
          userId: currentUser?.uid || null
        });
      } catch (notificationError) {
        console.error('Error creating club notification:', notificationError);
        // Don't fail the submission if notification fails
      }

      router.push("/clubs/submission-success");
    } catch (error) {
      console.error("Error submitting club:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-4xl mx-auto bg-white border border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-3xl font-bold font-headline text-gray-900">Register Your Car Club</CardTitle>
            <CardDescription className="text-gray-600">Provide detailed information about your club for our community to discover.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
              
              <fieldset className="space-y-6 border-t border-gray-200 pt-6">
                  <legend className="text-xl font-semibold font-headline text-gray-900">Club Information</legend>
                   <div className="space-y-2">
                      <Label htmlFor="clubName" className="text-gray-700 font-medium">Club Name</Label>
                      <Input id="clubName" {...register("clubName")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                      {errors.clubName && <p className="text-red-500 text-sm">{errors.clubName.message}</p>}
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="description" className="text-gray-700 font-medium">Detailed Description</Label>
                      <Textarea id="description" {...register("description")} rows={5} placeholder="Tell us about the history, mission, and focus of your club." className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"/>
                      {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <Label htmlFor="membershipCriteria" className="text-gray-700 font-medium">Membership Criteria</Label>
                          <Textarea id="membershipCriteria" {...register("membershipCriteria")} rows={3} placeholder="e.g., Owners of specific car makes, enthusiasts of a certain type of motorsport, etc." className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"/>
                          {errors.membershipCriteria && <p className="text-red-500 text-sm">{errors.membershipCriteria.message}</p>}
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="typicalActivities" className="text-gray-700 font-medium">Typical Activities</Label>
                          <Textarea id="typicalActivities" {...register("typicalActivities")} rows={3} placeholder="e.g., Monthly meetups, track days, scenic drives, social dinners, etc." className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"/>
                          {errors.typicalActivities && <p className="text-red-500 text-sm">{errors.typicalActivities.message}</p>}
                      </div>
                  </div>
              </fieldset>

              <fieldset className="space-y-6 border-t border-gray-200 pt-6">
                  <legend className="text-xl font-semibold font-headline text-gray-900">Location & Links</legend>
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
                    <Switch id="privacyMode" checked={!!watch("privacyMode")} onCheckedChange={(val) => setValue("privacyMode", !!val)} />
                    <Label htmlFor="privacyMode" className="text-gray-700">Privacy mode</Label>
                  </div>
                  <p className="text-xs text-gray-500 -mt-2">If enabled, your exact address will be hidden on the public page. Only your city/state will be shown.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <Label htmlFor="city" className="text-gray-700 font-medium">City</Label>
                          <Input id="city" {...register("city")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                          {errors.city && <p className="text-red-500 text-sm">{errors.city.message}</p>}
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="region" className="text-gray-700 font-medium">Region/State</Label>
                          <Input id="region" {...register("region")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                          {errors.region && <p className="text-red-500 text-sm">{errors.region.message}</p>}
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <Label htmlFor="website" className="text-gray-700 font-medium">Website URL</Label>
                          <Input id="website" {...register("website")} placeholder="https://example.com" className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                          {errors.website && <p className="text-red-500 text-sm">{errors.website.message}</p>}
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="socialMediaLink" className="text-gray-700 font-medium">Primary Social Media Link</Label>
                          <Input id="socialMediaLink" {...register("socialMediaLink")} placeholder="https://instagram.com/yourclub" className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                          {errors.socialMediaLink && <p className="text-red-500 text-sm">{errors.socialMediaLink.message}</p>}
                        </div>
                   </div>
               </fieldset>

              <fieldset className="space-y-6 border-t border-gray-200 pt-6">
                  <legend className="text-xl font-semibold font-headline text-gray-900">Contact & Media</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <Label htmlFor="contactName" className="text-gray-700 font-medium">Your Name (Club Representative)</Label>
                          <Input id="contactName" {...register("contactName")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                          {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName.message}</p>}
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="contactEmail" className="text-gray-700 font-medium">Your Contact Email</Label>
                          <Input id="contactEmail" type="email" {...register("contactEmail")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                          {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail.message}</p>}
                      </div>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="logo" className="text-gray-700 font-medium">Club Logo</Label>
                       <div className="flex flex-col items-center justify-center w-full">
                          <label htmlFor="logo" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                                  <p className="mb-2 text-sm text-gray-600"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                  <p className="text-xs text-gray-500">High resolution PNG or SVG preferred</p>
                              </div>
                              <Controller name="logo" control={control} render={({ field }) => (
                                <Input
                                  id="logo"
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={e => {
                                    const file = e.target.files ? e.target.files[0] : null;
                                    handleLogoChange(file);
                                    field.onChange(file);
                                  }}
                                />
                              )} />
                          </label>
                          {logoPreview && (
                            <div className="relative mt-4 w-40 h-40 flex items-center justify-center">
                              <img src={logoPreview} alt="Logo Preview" className="object-contain w-full h-full rounded shadow border border-gray-200" />
                              <button
                                type="button"
                                onClick={removeLogo}
                                className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-red hover:text-red-600 shadow"
                                aria-label="Remove logo"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                       </div>
                      {errors.logo && <p className="text-red-500 text-sm">{errors.logo.message as string}</p>}
                  </div>
              </fieldset>

              <div className="pt-2">
                <ConsentCheckbox control={control} />
                {errors.mediaConsent && (
                  <p className="text-red-500 text-sm mt-1">{String(errors.mediaConsent.message)}</p>
                )}
              </div>
              <Button type="submit" className="w-full text-lg py-6 bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600 focus:ring-yellow-400" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Club for Approval"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
