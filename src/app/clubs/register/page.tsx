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

const clubSchema = z.object({
  clubName: z.string().min(3, "Club name is required"),
  
  // Location and Contact
  city: z.string().min(2, "City is required"),
  country: z.string().min(2, "Country is required"),
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

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
  });

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

      await addDoc(collection(db, "pendingClubs"), {
        clubName: data.clubName,
        city: data.city,
        country: data.country,
        website: data.website,
        socialMediaLink: data.socialMediaLink,
        description: data.description,
        membershipCriteria: data.membershipCriteria,
        typicalActivities: data.typicalActivities,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        logoUrl,
        status: "pending",
        submittedAt: new Date(),
        uploadedByUserId: currentUser?.uid || null,
        uploadedByUserEmail: currentUser?.email || null,
      });

      router.push("/clubs/submission-success");
    } catch (error) {
      console.error("Error submitting club:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline text-primary">Register Your Car Club</CardTitle>
          <CardDescription>Provide detailed information about your club for our community to discover.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Club Information</legend>
                 <div className="space-y-2">
                    <Label htmlFor="clubName">Club Name</Label>
                    <Input id="clubName" {...register("clubName")} />
                    {errors.clubName && <p className="text-red-500 text-sm">{errors.clubName.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="description">Detailed Description</Label>
                    <Textarea id="description" {...register("description")} rows={5} placeholder="Tell us about the history, mission, and focus of your club."/>
                    {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="membershipCriteria">Membership Criteria</Label>
                        <Textarea id="membershipCriteria" {...register("membershipCriteria")} rows={3} placeholder="e.g., Owners of specific car makes, enthusiasts of a certain type of motorsport, etc."/>
                        {errors.membershipCriteria && <p className="text-red-500 text-sm">{errors.membershipCriteria.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="typicalActivities">Typical Activities</Label>
                        <Textarea id="typicalActivities" {...register("typicalActivities")} rows={3} placeholder="e.g., Monthly meetups, track days, scenic drives, social dinners, etc."/>
                        {errors.typicalActivities && <p className="text-red-500 text-sm">{errors.typicalActivities.message}</p>}
                    </div>
                </div>
            </fieldset>

            <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Location & Links</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" {...register("city")} />
                        {errors.city && <p className="text-red-500 text-sm">{errors.city.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" {...register("country")} />
                        {errors.country && <p className="text-red-500 text-sm">{errors.country.message}</p>}
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="website">Website URL</Label>
                        <Input id="website" {...register("website")} placeholder="https://example.com" />
                        {errors.website && <p className="text-red-500 text-sm">{errors.website.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="socialMediaLink">Primary Social Media Link</Label>
                        <Input id="socialMediaLink" {...register("socialMediaLink")} placeholder="https://instagram.com/yourclub" />
                        {errors.socialMediaLink && <p className="text-red-500 text-sm">{errors.socialMediaLink.message}</p>}
                    </div>
                </div>
            </fieldset>

            <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Contact & Media</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="contactName">Your Name (Club Representative)</Label>
                        <Input id="contactName" {...register("contactName")} />
                        {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contactEmail">Your Contact Email</Label>
                        <Input id="contactEmail" type="email" {...register("contactEmail")} />
                        {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail.message}</p>}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="logo">Club Logo</Label>
                     <div className="flex flex-col items-center justify-center w-full">
                        <label htmlFor="logo" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">High resolution PNG or SVG preferred</p>
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
                            <img src={logoPreview} alt="Logo Preview" className="object-contain w-full h-full rounded shadow border" />
                            <button
                              type="button"
                              onClick={removeLogo}
                              className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-destructive hover:text-red-600 shadow"
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

            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Club for Approval"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
