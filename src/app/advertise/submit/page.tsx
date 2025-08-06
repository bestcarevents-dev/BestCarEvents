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
import { createPartnerRequestNotification } from "@/lib/notifications";

const partnerCategories = [
  "Tires & Wheels",
  "Car Parts & Accessories",
  "Car Transport & Logistics",
  "Car Detailing & Wrapping",
  "Restoration & Custom Shops",
  "Classic Car Insurance",
  "Driving Experiences",
  "Finance / Leasing / Storage"
] as const;

const partnerSchema = z.object({
  partnerName: z.string().min(2, "Your name is required"),
  businessName: z.string().min(2, "Business name is required"),
  contactEmail: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  socialMedia: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  description: z.string().min(20, "Description is required"),
  logo: z
    .any()
    .refine(
      (file) => typeof window === "undefined" || (file instanceof File && file.size > 0),
      "A logo is required"
    ),
  paymentMethod: z.enum(["card", "paypal"]),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

export default function PartnerSubmitPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [mockPaid, setMockPaid] = useState(false);
  const router = useRouter();
  const db = getFirestore(app);
  const storage = getStorage(app);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: { categories: [], paymentMethod: "card" }
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
    setValue("logo", file as any);
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

  const onSubmit = async (data: PartnerFormData) => {
    setIsSubmitting(true);
    try {
      // Mock payment step
      if (!mockPaid) {
        setIsSubmitting(false);
        return;
      }
      // Upload logo
      const logoRef = ref(storage, `partner_logos/${Date.now()}_${data.logo.name}`);
      await uploadBytes(logoRef, data.logo);
      const logoUrl = await getDownloadURL(logoRef);
      
      const partnerData = {
        partnerName: data.partnerName,
        businessName: data.businessName,
        contactEmail: data.contactEmail,
        phone: data.phone,
        website: data.website,
        socialMedia: data.socialMedia,
        categories: data.categories,
        description: data.description,
        logoUrl,
        paymentMethod: data.paymentMethod,
        status: "approved",
        submittedAt: new Date(),
        uploadedByUserId: currentUser?.uid || null,
        uploadedByUserEmail: currentUser?.email || null,
      };

      const docRef = await addDoc(collection(db, "pendingPartners"), partnerData);
      
      // Create notification (non-blocking)
      try {
        await createPartnerRequestNotification({
          ...partnerData,
          id: docRef.id,
          userId: currentUser?.uid || null
        });
      } catch (notificationError) {
        console.error('Error creating partner notification:', notificationError);
        // Don't fail the submission if notification fails
      }

      router.push("/advertise/my-ads");
    } catch (error) {
      console.error("Error submitting partner:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline text-primary">Become a Partner</CardTitle>
          <CardDescription>Promote your business to a dedicated audience of car enthusiasts. Fill out the form below to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Partner Info */}
            <fieldset className="space-y-6 border-t pt-6">
              <legend className="text-xl font-semibold font-headline">Partner Information</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="partnerName">Your Name</Label>
                  <Input id="partnerName" {...register("partnerName")} />
                  {errors.partnerName && <p className="text-red-500 text-sm">{errors.partnerName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input id="businessName" {...register("businessName")} />
                  {errors.businessName && <p className="text-red-500 text-sm">{errors.businessName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input id="contactEmail" type="email" {...register("contactEmail")} />
                  {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input id="phone" {...register("phone")} />
                </div>
              </div>
            </fieldset>

            {/* Links */}
            <fieldset className="space-y-6 border-t pt-6">
              <legend className="text-xl font-semibold font-headline">Links</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" {...register("website")} placeholder="https://example.com" />
                  {errors.website && <p className="text-red-500 text-sm">{errors.website.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialMedia">Social Media Link</Label>
                  <Input id="socialMedia" {...register("socialMedia")} placeholder="https://instagram.com/yourbusiness" />
                  {errors.socialMedia && <p className="text-red-500 text-sm">{errors.socialMedia.message}</p>}
                </div>
              </div>
            </fieldset>

            {/* Categories */}
            <fieldset className="space-y-6 border-t pt-6">
              <legend className="text-xl font-semibold font-headline">Categories <span className='text-xs text-muted-foreground'>(Select all that apply. +$10 for each extra category)</span></legend>
              <Controller
                name="categories"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {partnerCategories.map(category => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={field.value?.includes(category)}
                          onCheckedChange={checked => {
                            return checked
                              ? field.onChange([...(field.value || []), category])
                              : field.onChange(field.value?.filter((v: string) => v !== category));
                          }}
                        />
                        <Label htmlFor={category} className="font-normal">{category}</Label>
                      </div>
                    ))}
                  </div>
                )}
              />
              {errors.categories && <p className="text-red-500 text-sm">{errors.categories.message as string}</p>}
              <div className="text-sm text-muted-foreground mt-2">Fee: <span className="font-bold text-primary">${50 + 10 * (watchCategoriesLength() - 1)}</span> (first category $50, each extra +$10)</div>
            </fieldset>

            {/* Description */}
            <fieldset className="space-y-6 border-t pt-6">
              <legend className="text-xl font-semibold font-headline">Description</legend>
              <div className="space-y-2">
                <Label htmlFor="description">Describe your services</Label>
                <Textarea id="description" {...register("description")} rows={5} />
                {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
              </div>
            </fieldset>

            {/* Logo Upload */}
            <fieldset className="space-y-6 border-t pt-6">
              <legend className="text-xl font-semibold font-headline">Logo</legend>
              <div className="space-y-2">
                <Label htmlFor="logo">Upload Logo</Label>
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

            {/* Mock Payment */}
            <fieldset className="space-y-6 border-t pt-6">
              <legend className="text-xl font-semibold font-headline">Payment (Mock)</legend>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <input type="radio" id="pay-card" value="card" {...register("paymentMethod")}/>
                  <Label htmlFor="pay-card">Pay with Card</Label>
                  <input type="radio" id="pay-paypal" value="paypal" {...register("paymentMethod")}/>
                  <Label htmlFor="pay-paypal">Pay with PayPal</Label>
                </div>
                <Button type="button" variant={mockPaid ? "default" : "default"} onClick={() => setMockPaid(true)} disabled={mockPaid}>
                  {mockPaid ? "Payment Successful (Mock)" : "Pay Now (Mock)"}
                </Button>
                {!mockPaid && <p className="text-sm text-muted-foreground">You must complete payment before submitting.</p>}
              </div>
            </fieldset>

            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting || !mockPaid}>
              {isSubmitting ? "Submitting..." : "Submit Partner Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  // Helper to watch categories length for fee calculation
  function watchCategoriesLength() {
    const categories = (control._formValues?.categories || []);
    return categories.length || 1;
  }
} 