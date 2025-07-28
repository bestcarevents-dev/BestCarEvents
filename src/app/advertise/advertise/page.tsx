"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getFirestore, collection, addDoc, doc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { app } from "@/lib/firebase";
import { UploadCloud, X, Info } from "lucide-react";
import { useRouter } from "next/navigation";

const adTypes = [
  "Tires & Wheels",
  "Car Parts & Accessories",
  "Car Transport & Logistics",
  "Car Detailing & Wrapping",
  "Restoration & Custom Shops",
  "Classic Car Insurance",
  "Driving Experiences",
  "Finance / Leasing / Storage"
];

const tiresWheelsSchema = z.object({
  title: z.string().min(3, "Product name is required"),
  brand: z.string().min(2, "Brand is required"),
  size: z.string().min(1, "Size is required"),
  price: z.string().min(1, "Price is required"),
  description: z.string().min(10, "Description is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Invalid email address"),
  images: z.any(),
});
type TiresWheelsFormData = z.infer<typeof tiresWheelsSchema>;

const carPartsSchema = z.object({
  title: z.string().min(3, "Product name is required"),
  partType: z.string().min(2, "Part type is required"),
  brand: z.string().min(2, "Brand is required"),
  compatibleVehicles: z.string().min(2, "Compatible vehicles are required"),
  price: z.string().min(1, "Price is required"),
  description: z.string().min(10, "Description is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Invalid email address"),
  images: z.any(),
});
type CarPartsFormData = z.infer<typeof carPartsSchema>;

const transportSchema = z.object({
  title: z.string().min(3, "Service name is required"),
  serviceType: z.string().min(2, "Service type is required"),
  coverageArea: z.string().min(2, "Coverage area is required"),
  priceRange: z.string().min(1, "Price range is required"),
  description: z.string().min(10, "Description is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Invalid email address"),
  images: z.any(),
});
type TransportFormData = z.infer<typeof transportSchema>;

const detailingSchema = z.object({
  title: z.string().min(3, "Service name is required"),
  serviceType: z.string().min(2, "Service type is required"),
  priceRange: z.string().min(1, "Price range is required"),
  description: z.string().min(10, "Description is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Invalid email address"),
  images: z.any(),
});
type DetailingFormData = z.infer<typeof detailingSchema>;

const restorationSchema = z.object({
  shopName: z.string().min(3, "Shop name is required"),
  specialties: z.string().min(3, "Specialties are required"),
  yearsInBusiness: z.string().min(1, "Years in business is required"),
  priceRange: z.string().min(1, "Price range is required"),
  description: z.string().min(10, "Description is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Invalid email address"),
  images: z.any(),
});
type RestorationFormData = z.infer<typeof restorationSchema>;

const insuranceSchema = z.object({
  providerName: z.string().min(3, "Provider name is required"),
  insuranceTypes: z.string().min(3, "Insurance types are required"),
  coverageArea: z.string().min(2, "Coverage area is required"),
  priceRange: z.string().min(1, "Price range is required"),
  description: z.string().min(10, "Description is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Invalid email address"),
  images: z.any(),
});
type InsuranceFormData = z.infer<typeof insuranceSchema>;

const drivingExpSchema = z.object({
  experienceName: z.string().min(3, "Experience name is required"),
  experienceType: z.string().min(2, "Experience type is required"),
  location: z.string().min(2, "Location is required"),
  price: z.string().min(1, "Price is required"),
  description: z.string().min(10, "Description is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Invalid email address"),
  images: z.any(),
});
type DrivingExpFormData = z.infer<typeof drivingExpSchema>;

const financeSchema = z.object({
  serviceName: z.string().min(3, "Service name is required"),
  serviceType: z.string().min(2, "Service type is required"),
  coverageArea: z.string().min(2, "Coverage area is required"),
  priceRange: z.string().min(1, "Price range is required"),
  description: z.string().min(10, "Description is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Invalid email address"),
  images: z.any(),
});
type FinanceFormData = z.infer<typeof financeSchema>;

export default function AdvertisePage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const router = useRouter();
  const db = getFirestore(app);
  const storage = getStorage(app);
  const MAX_IMAGES = 8;

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<TiresWheelsFormData>({
    resolver: zodResolver(tiresWheelsSchema),
    defaultValues: { images: [] }
  });

  useEffect(() => {
    setValue("images", images);
  }, [images, setValue]);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch user document for banner remaining counts
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        setUserDoc(userSnap.exists() ? userSnap.data() : null);
      }
    });
    return () => unsubscribe();
  }, [db]);

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

  const onSubmit = async (data: TiresWheelsFormData) => {
    setIsSubmitting(true);
    try {
      if (!currentUser) {
        alert("You must be logged in to submit an ad.");
        setIsSubmitting(false);
        return;
      }
      if (!images || !Array.isArray(images) || images.length === 0 || !images.every(img => img instanceof File)) {
        alert("Please upload at least one valid image.");
        setIsSubmitting(false);
        return;
      }
      const imageUrls = [];
      for (const file of images) {
        const imageRef = ref(storage, `partner_ads/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      }
      await addDoc(collection(db, "partnerAds"), {
        adType: "Tires & Wheels",
        title: data.title,
        brand: data.brand,
        size: data.size,
        price: data.price,
        description: data.description,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        imageUrls,
        status: "pending",
        submittedAt: new Date(),
        uploadedByUserId: currentUser?.uid || null,
        uploadedByUserEmail: currentUser?.email || null,
      });
      router.push("/partners/dashboard");
    } catch (error) {
      console.error("Error submitting ad:", error);
      alert("Error submitting ad. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Banner Remaining Cards */}
      {userDoc && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Your Banner Advertisement Quota</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">Category Page Banner</h3>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/advertise/dashboard')}
                >
                  Buy More
                </Button>
              </div>
              <div className="text-center mb-3">
                <p className="text-2xl font-bold text-primary">
                  {userDoc.categoryBannerRemaining || 0}
                </p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Category page banners only allow your ad to be shown in a specific category page. 
                This provides targeted exposure to users browsing that particular category.
              </p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">Homepage Banner</h3>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/advertise/dashboard')}
                >
                  Buy More
                </Button>
              </div>
              <div className="text-center mb-3">
                <p className="text-2xl font-bold text-primary">
                  {userDoc.homepageBannerRemaining || 0}
                </p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Homepage banner remaining allows your ad to be seen on the homepage along with category pages. 
                This provides maximum exposure across the entire website.
              </p>
            </Card>
          </div>
        </div>
      )}

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline text-primary">Advertise Your Product or Service</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedType ? (
            <div>
              <h2 className="text-lg font-semibold mb-4">Choose the type of ad you want to create:</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adTypes.map(type => (
                  <Button key={type} variant="outline" className="w-full py-6 text-lg" onClick={() => setSelectedType(type)}>
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          ) : selectedType === "Tires & Wheels" ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Product Information</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Product Name</Label>
                    <Input id="title" {...register("title")} />
                    {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input id="brand" {...register("brand")} />
                    {errors.brand && <p className="text-red-500 text-sm">{errors.brand.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Input id="size" {...register("size")} />
                    {errors.size && <p className="text-red-500 text-sm">{errors.size.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input id="price" {...register("price")} />
                    {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...register("description")} rows={4} />
                  {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                </div>
              </fieldset>
              <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Contact Information</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input id="contactName" {...register("contactName")} />
                    {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input id="contactEmail" type="email" {...register("contactEmail")} />
                    {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail.message}</p>}
                  </div>
                </div>
              </fieldset>
              <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Product Images</legend>
                <div className="space-y-2">
                  <Label htmlFor="images">Upload Images</Label>
                  <div className="flex flex-col items-center justify-center w-full">
                    <label htmlFor="images" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      </div>
                      <Input id="images" type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
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
              </fieldset>
              <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Ad for Review"}
              </Button>
              <Button className="mt-4 w-full" variant="secondary" type="button" onClick={() => setSelectedType(null)}>
                Back to Ad Type Selection
              </Button>
            </form>
          ) : selectedType === "Car Parts & Accessories" ? (
            <CarPartsAccessoriesForm
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
              images={images}
              setImages={setImages}
              imagePreviews={imagePreviews}
              setImagePreviews={setImagePreviews}
              currentUser={currentUser}
              router={router}
              db={db}
              storage={storage}
              MAX_IMAGES={MAX_IMAGES}
            />
          ) : selectedType === "Car Transport & Logistics" ? (
            <CarTransportLogisticsForm
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
              images={images}
              setImages={setImages}
              imagePreviews={imagePreviews}
              setImagePreviews={setImagePreviews}
              currentUser={currentUser}
              router={router}
              db={db}
              storage={storage}
              MAX_IMAGES={MAX_IMAGES}
            />
          ) : selectedType === "Car Detailing & Wrapping" ? (
            <CarDetailingWrappingForm
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
              images={images}
              setImages={setImages}
              imagePreviews={imagePreviews}
              setImagePreviews={setImagePreviews}
              currentUser={currentUser}
              router={router}
              db={db}
              storage={storage}
              MAX_IMAGES={MAX_IMAGES}
            />
          ) : selectedType === "Restoration & Custom Shops" ? (
            <RestorationCustomShopsForm
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
              images={images}
              setImages={setImages}
              imagePreviews={imagePreviews}
              setImagePreviews={setImagePreviews}
              currentUser={currentUser}
              router={router}
              db={db}
              storage={storage}
              MAX_IMAGES={MAX_IMAGES}
            />
          ) : selectedType === "Classic Car Insurance" ? (
            <ClassicCarInsuranceForm
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
              images={images}
              setImages={setImages}
              imagePreviews={imagePreviews}
              setImagePreviews={setImagePreviews}
              currentUser={currentUser}
              router={router}
              db={db}
              storage={storage}
              MAX_IMAGES={MAX_IMAGES}
            />
          ) : selectedType === "Driving Experiences" ? (
            <DrivingExperiencesForm
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
              images={images}
              setImages={setImages}
              imagePreviews={imagePreviews}
              setImagePreviews={setImagePreviews}
              currentUser={currentUser}
              router={router}
              db={db}
              storage={storage}
              MAX_IMAGES={MAX_IMAGES}
            />
          ) : selectedType === "Finance / Leasing / Storage" ? (
            <FinanceLeasingStorageForm
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
              images={images}
              setImages={setImages}
              imagePreviews={imagePreviews}
              setImagePreviews={setImagePreviews}
              currentUser={currentUser}
              router={router}
              db={db}
              storage={storage}
              MAX_IMAGES={MAX_IMAGES}
            />
          ) : (
            <div>
              <h2 className="text-lg font-semibold mb-4">{selectedType} Advertisement</h2>
              {/* Placeholder for the comprehensive form for this ad type */}
              <div className="bg-muted p-8 rounded-lg text-center text-muted-foreground">
                The comprehensive form for <span className="font-bold">{selectedType}</span> will appear here.
              </div>
              <Button className="mt-6" variant="secondary" onClick={() => setSelectedType(null)}>
                Back to Ad Type Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CarPartsAccessoriesForm({ isSubmitting, setIsSubmitting, images, setImages, imagePreviews, setImagePreviews, currentUser, router, db, storage, MAX_IMAGES }: any) {
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<CarPartsFormData>({
    resolver: zodResolver(carPartsSchema),
    defaultValues: { images: [] }
  });
  useEffect(() => { setValue("images", images); }, [images, setValue]);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const newFiles = files.filter(f => !images.some((img: File) => img.name === f.name && img.size === f.size));
    setImages((prev: File[]) => [...prev, ...newFiles].slice(0, MAX_IMAGES));
    setImagePreviews((prev: string[]) => [ ...prev, ...newFiles.map(file => URL.createObjectURL(file)) ].slice(0, MAX_IMAGES));
  };
  const removeImage = (idx: number) => {
    setImages((prev: File[]) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev: string[]) => { URL.revokeObjectURL(prev[idx]); return prev.filter((_, i) => i !== idx); });
  };
  const onSubmit = async (data: CarPartsFormData) => {
    setIsSubmitting(true);
    try {
      if (!currentUser) {
        alert("You must be logged in to submit an ad.");
        setIsSubmitting(false);
        return;
      }
      if (!images || !Array.isArray(images) || images.length === 0 || !images.every(img => img instanceof File)) {
        alert("Please upload at least one valid image.");
        setIsSubmitting(false);
        return;
      }
      const imageUrls = [];
      for (const file of images) {
        const imageRef = ref(storage, `partner_ads/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      }
      await addDoc(collection(db, "partnerAds"), {
        adType: "Car Parts & Accessories",
        title: data.title,
        partType: data.partType,
        brand: data.brand,
        compatibleVehicles: data.compatibleVehicles,
        price: data.price,
        description: data.description,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        imageUrls,
        status: "pending",
        submittedAt: new Date(),
        uploadedByUserId: currentUser?.uid || null,
        uploadedByUserEmail: currentUser?.email || null,
      });
      router.push("/partners/dashboard");
    } catch (error) {
      console.error("Error submitting ad:", error);
      alert("Error submitting ad. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Part Information</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">Product Name</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="partType">Part Type</Label>
            <Input id="partType" {...register("partType")} placeholder="e.g. Brake Pads, Air Filter" />
            {errors.partType && <p className="text-red-500 text-sm">{errors.partType.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" {...register("brand")} />
            {errors.brand && <p className="text-red-500 text-sm">{errors.brand.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="compatibleVehicles">Compatible Vehicles</Label>
            <Input id="compatibleVehicles" {...register("compatibleVehicles")} placeholder="e.g. Toyota Corolla, Honda Civic" />
            {errors.compatibleVehicles && <p className="text-red-500 text-sm">{errors.compatibleVehicles.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input id="price" {...register("price")} />
            {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} rows={4} />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
        </div>
      </fieldset>
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Contact Information</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input id="contactName" {...register("contactName")} />
            {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input id="contactEmail" type="email" {...register("contactEmail")} />
            {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail.message}</p>}
          </div>
        </div>
      </fieldset>
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Product Images</legend>
        <div className="space-y-2">
          <Label htmlFor="images">Upload Images</Label>
          <div className="flex flex-col items-center justify-center w-full">
            <label htmlFor="images" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              </div>
              <Input id="images" type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
            </label>
            <div className="flex flex-wrap gap-4 mt-4">
              {imagePreviews.map((src: string, idx: number) => (
                <div key={src} className="relative group">
                  <img src={src} alt={`Preview ${idx + 1}`} className="w-32 h-24 object-cover rounded shadow" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-destructive hover:text-red-600 shadow"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
          {errors.images && <p className="text-red-500 text-sm">{errors.images.message as string}</p>}
        </div>
      </fieldset>
      <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Ad for Review"}
      </Button>
      <Button className="mt-4 w-full" variant="secondary" type="button" onClick={() => window.location.reload()}>
        Back to Ad Type Selection
      </Button>
    </form>
  );
}

function CarTransportLogisticsForm({ isSubmitting, setIsSubmitting, images, setImages, imagePreviews, setImagePreviews, currentUser, router, db, storage, MAX_IMAGES }: any) {
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<TransportFormData>({
    resolver: zodResolver(transportSchema),
    defaultValues: { images: [] }
  });
  useEffect(() => { setValue("images", images); }, [images, setValue]);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const newFiles = files.filter(f => !images.some((img: File) => img.name === f.name && img.size === f.size));
    setImages((prev: File[]) => [...prev, ...newFiles].slice(0, MAX_IMAGES));
    setImagePreviews((prev: string[]) => [ ...prev, ...newFiles.map(file => URL.createObjectURL(file)) ].slice(0, MAX_IMAGES));
  };
  const removeImage = (idx: number) => {
    setImages((prev: File[]) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev: string[]) => { URL.revokeObjectURL(prev[idx]); return prev.filter((_, i) => i !== idx); });
  };
  const onSubmit = async (data: TransportFormData) => {
    setIsSubmitting(true);
    try {
      if (!currentUser) {
        alert("You must be logged in to submit an ad.");
        setIsSubmitting(false);
        return;
      }
      if (!images || !Array.isArray(images) || images.length === 0 || !images.every(img => img instanceof File)) {
        alert("Please upload at least one valid image.");
        setIsSubmitting(false);
        return;
      }
      const imageUrls = [];
      for (const file of images) {
        const imageRef = ref(storage, `partner_ads/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      }
      await addDoc(collection(db, "partnerAds"), {
        adType: "Car Transport & Logistics",
        title: data.title,
        serviceType: data.serviceType,
        coverageArea: data.coverageArea,
        priceRange: data.priceRange,
        description: data.description,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        imageUrls,
        status: "pending",
        submittedAt: new Date(),
        uploadedByUserId: currentUser?.uid || null,
        uploadedByUserEmail: currentUser?.email || null,
      });
      router.push("/partners/dashboard");
    } catch (error) {
      console.error("Error submitting ad:", error);
      alert("Error submitting ad. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Service Information</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">Service Name</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type</Label>
            <Input id="serviceType" {...register("serviceType")} placeholder="e.g. Enclosed Transport, Open Carrier" />
            {errors.serviceType && <p className="text-red-500 text-sm">{errors.serviceType.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="coverageArea">Coverage Area</Label>
            <Input id="coverageArea" {...register("coverageArea")} placeholder="e.g. Nationwide, Europe" />
            {errors.coverageArea && <p className="text-red-500 text-sm">{errors.coverageArea.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="priceRange">Price Range</Label>
            <Input id="priceRange" {...register("priceRange")} placeholder="e.g. $500 - $2000" />
            {errors.priceRange && <p className="text-red-500 text-sm">{errors.priceRange.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} rows={4} />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
        </div>
      </fieldset>
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Contact Information</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input id="contactName" {...register("contactName")} />
            {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input id="contactEmail" type="email" {...register("contactEmail")} />
            {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail.message}</p>}
          </div>
        </div>
      </fieldset>
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Service Images</legend>
        <div className="space-y-2">
          <Label htmlFor="images">Upload Images</Label>
          <div className="flex flex-col items-center justify-center w-full">
            <label htmlFor="images" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              </div>
              <Input id="images" type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
            </label>
            <div className="flex flex-wrap gap-4 mt-4">
              {imagePreviews.map((src: string, idx: number) => (
                <div key={src} className="relative group">
                  <img src={src} alt={`Preview ${idx + 1}`} className="w-32 h-24 object-cover rounded shadow" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-destructive hover:text-red-600 shadow"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
          {errors.images && <p className="text-red-500 text-sm">{errors.images.message as string}</p>}
        </div>
      </fieldset>
      <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Ad for Review"}
      </Button>
      <Button className="mt-4 w-full" variant="secondary" type="button" onClick={() => window.location.reload()}>
        Back to Ad Type Selection
      </Button>
    </form>
  );
}

function CarDetailingWrappingForm({ isSubmitting, setIsSubmitting, images, setImages, imagePreviews, setImagePreviews, currentUser, router, db, storage, MAX_IMAGES }: any) {
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<DetailingFormData>({
    resolver: zodResolver(detailingSchema),
    defaultValues: { images: [] }
  });
  useEffect(() => { setValue("images", images); }, [images, setValue]);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const newFiles = files.filter(f => !images.some((img: File) => img.name === f.name && img.size === f.size));
    setImages((prev: File[]) => [...prev, ...newFiles].slice(0, MAX_IMAGES));
    setImagePreviews((prev: string[]) => [ ...prev, ...newFiles.map(file => URL.createObjectURL(file)) ].slice(0, MAX_IMAGES));
  };
  const removeImage = (idx: number) => {
    setImages((prev: File[]) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev: string[]) => { URL.revokeObjectURL(prev[idx]); return prev.filter((_, i) => i !== idx); });
  };
  const onSubmit = async (data: DetailingFormData) => {
    setIsSubmitting(true);
    try {
      if (!currentUser) {
        alert("You must be logged in to submit an ad.");
        setIsSubmitting(false);
        return;
      }
      if (!images || !Array.isArray(images) || images.length === 0 || !images.every(img => img instanceof File)) {
        alert("Please upload at least one valid image.");
        setIsSubmitting(false);
        return;
      }
      const imageUrls = [];
      for (const file of images) {
        const imageRef = ref(storage, `partner_ads/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      }
      await addDoc(collection(db, "partnerAds"), {
        adType: "Car Detailing & Wrapping",
        title: data.title,
        serviceType: data.serviceType,
        priceRange: data.priceRange,
        description: data.description,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        imageUrls,
        status: "pending",
        submittedAt: new Date(),
        uploadedByUserId: currentUser?.uid || null,
        uploadedByUserEmail: currentUser?.email || null,
      });
      router.push("/partners/dashboard");
    } catch (error) {
      console.error("Error submitting ad:", error);
      alert("Error submitting ad. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Service Information</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">Service Name</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type</Label>
            <Input id="serviceType" {...register("serviceType")} placeholder="e.g. Ceramic Coating, Vinyl Wrap" />
            {errors.serviceType && <p className="text-red-500 text-sm">{errors.serviceType.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="priceRange">Price Range</Label>
            <Input id="priceRange" {...register("priceRange")} placeholder="e.g. $200 - $2000" />
            {errors.priceRange && <p className="text-red-500 text-sm">{errors.priceRange.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} rows={4} />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
        </div>
      </fieldset>
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Contact Information</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input id="contactName" {...register("contactName")} />
            {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input id="contactEmail" type="email" {...register("contactEmail")} />
            {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail.message}</p>}
          </div>
        </div>
      </fieldset>
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Service Images</legend>
        <div className="space-y-2">
          <Label htmlFor="images">Upload Images</Label>
          <div className="flex flex-col items-center justify-center w-full">
            <label htmlFor="images" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              </div>
              <Input id="images" type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
            </label>
            <div className="flex flex-wrap gap-4 mt-4">
              {imagePreviews.map((src: string, idx: number) => (
                <div key={src} className="relative group">
                  <img src={src} alt={`Preview ${idx + 1}`} className="w-32 h-24 object-cover rounded shadow" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-destructive hover:text-red-600 shadow"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
          {errors.images && <p className="text-red-500 text-sm">{errors.images.message as string}</p>}
        </div>
      </fieldset>
      <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Ad for Review"}
      </Button>
      <Button className="mt-4 w-full" variant="secondary" type="button" onClick={() => window.location.reload()}>
        Back to Ad Type Selection
      </Button>
    </form>
  );
}

function RestorationCustomShopsForm({ isSubmitting, setIsSubmitting, images, setImages, imagePreviews, setImagePreviews, currentUser, router, db, storage, MAX_IMAGES }: any) {
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<RestorationFormData>({
    resolver: zodResolver(restorationSchema),
    defaultValues: { images: [] }
  });
  useEffect(() => { setValue("images", images); }, [images, setValue]);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const newFiles = files.filter(f => !images.some((img: File) => img.name === f.name && img.size === f.size));
    setImages((prev: File[]) => [...prev, ...newFiles].slice(0, MAX_IMAGES));
    setImagePreviews((prev: string[]) => [ ...prev, ...newFiles.map(file => URL.createObjectURL(file)) ].slice(0, MAX_IMAGES));
  };
  const removeImage = (idx: number) => {
    setImages((prev: File[]) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev: string[]) => { URL.revokeObjectURL(prev[idx]); return prev.filter((_, i) => i !== idx); });
  };
  const onSubmit = async (data: RestorationFormData) => {
    setIsSubmitting(true);
    try {
      if (!currentUser) {
        alert("You must be logged in to submit an ad.");
        setIsSubmitting(false);
        return;
      }
      if (!images || !Array.isArray(images) || images.length === 0 || !images.every(img => img instanceof File)) {
        alert("Please upload at least one valid image.");
        setIsSubmitting(false);
        return;
      }
      const imageUrls = [];
      for (const file of images) {
        const imageRef = ref(storage, `partner_ads/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      }
      await addDoc(collection(db, "partnerAds"), {
        adType: "Restoration & Custom Shops",
        shopName: data.shopName,
        specialties: data.specialties,
        yearsInBusiness: data.yearsInBusiness,
        priceRange: data.priceRange,
        description: data.description,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        imageUrls,
        status: "pending",
        submittedAt: new Date(),
        uploadedByUserId: currentUser?.uid || null,
        uploadedByUserEmail: currentUser?.email || null,
      });
      router.push("/partners/dashboard");
    } catch (error) {
      console.error("Error submitting ad:", error);
      alert("Error submitting ad. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Shop Information</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="shopName">Shop Name</Label>
            <Input id="shopName" {...register("shopName")} />
            {errors.shopName && <p className="text-red-500 text-sm">{errors.shopName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialties">Specialties</Label>
            <Input id="specialties" {...register("specialties")} placeholder="e.g. Classic Restoration, Custom Builds" />
            {errors.specialties && <p className="text-red-500 text-sm">{errors.specialties.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearsInBusiness">Years in Business</Label>
            <Input id="yearsInBusiness" {...register("yearsInBusiness")} placeholder="e.g. 10" />
            {errors.yearsInBusiness && <p className="text-red-500 text-sm">{errors.yearsInBusiness.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="priceRange">Price Range</Label>
            <Input id="priceRange" {...register("priceRange")} placeholder="e.g. $5,000 - $100,000" />
            {errors.priceRange && <p className="text-red-500 text-sm">{errors.priceRange.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} rows={4} />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
        </div>
      </fieldset>
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Contact Information</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input id="contactName" {...register("contactName")} />
            {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input id="contactEmail" type="email" {...register("contactEmail")} />
            {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail.message}</p>}
          </div>
        </div>
      </fieldset>
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Shop Images</legend>
        <div className="space-y-2">
          <Label htmlFor="images">Upload Images</Label>
          <div className="flex flex-col items-center justify-center w-full">
            <label htmlFor="images" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              </div>
              <Input id="images" type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
            </label>
            <div className="flex flex-wrap gap-4 mt-4">
              {imagePreviews.map((src: string, idx: number) => (
                <div key={src} className="relative group">
                  <img src={src} alt={`Preview ${idx + 1}`} className="w-32 h-24 object-cover rounded shadow" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-destructive hover:text-red-600 shadow"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
          {errors.images && <p className="text-red-500 text-sm">{errors.images.message as string}</p>}
        </div>
      </fieldset>
      <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Ad for Review"}
      </Button>
      <Button className="mt-4 w-full" variant="secondary" type="button" onClick={() => window.location.reload()}>
        Back to Ad Type Selection
      </Button>
    </form>
  );
}

function ClassicCarInsuranceForm({ isSubmitting, setIsSubmitting, images, setImages, imagePreviews, setImagePreviews, currentUser, router, db, storage, MAX_IMAGES }: any) {
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<InsuranceFormData>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: { images: [] }
  });
  useEffect(() => { setValue("images", images); }, [images, setValue]);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const newFiles = files.filter(f => !images.some((img: File) => img.name === f.name && img.size === f.size));
    setImages((prev: File[]) => [...prev, ...newFiles].slice(0, MAX_IMAGES));
    setImagePreviews((prev: string[]) => [ ...prev, ...newFiles.map(file => URL.createObjectURL(file)) ].slice(0, MAX_IMAGES));
  };
  const removeImage = (idx: number) => {
    setImages((prev: File[]) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev: string[]) => { URL.revokeObjectURL(prev[idx]); return prev.filter((_, i) => i !== idx); });
  };
  const onSubmit = async (data: InsuranceFormData) => {
    setIsSubmitting(true);
    try {
      if (!currentUser) {
        alert("You must be logged in to submit an ad.");
        setIsSubmitting(false);
        return;
      }
      if (!images || !Array.isArray(images) || images.length === 0 || !images.every(img => img instanceof File)) {
        alert("Please upload at least one valid image.");
        setIsSubmitting(false);
        return;
      }
      const imageUrls = [];
      for (const file of images) {
        const imageRef = ref(storage, `partner_ads/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      }
      await addDoc(collection(db, "partnerAds"), {
        adType: "Classic Car Insurance",
        providerName: data.providerName,
        insuranceTypes: data.insuranceTypes,
        coverageArea: data.coverageArea,
        priceRange: data.priceRange,
        description: data.description,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        imageUrls,
        status: "pending",
        submittedAt: new Date(),
        uploadedByUserId: currentUser?.uid || null,
        uploadedByUserEmail: currentUser?.email || null,
      });
      router.push("/partners/dashboard");
    } catch (error) {
      console.error("Error submitting ad:", error);
      alert("Error submitting ad. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Insurance Provider Information</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="providerName">Provider Name</Label>
            <Input id="providerName" {...register("providerName")} />
            {errors.providerName && <p className="text-red-500 text-sm">{errors.providerName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="insuranceTypes">Insurance Types</Label>
            <Input id="insuranceTypes" {...register("insuranceTypes")} placeholder="e.g. Agreed Value, Spare Parts, Roadside Assistance" />
            {errors.insuranceTypes && <p className="text-red-500 text-sm">{errors.insuranceTypes.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="coverageArea">Coverage Area</Label>
            <Input id="coverageArea" {...register("coverageArea")} placeholder="e.g. Nationwide, Europe" />
            {errors.coverageArea && <p className="text-red-500 text-sm">{errors.coverageArea.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="priceRange">Price Range</Label>
            <Input id="priceRange" {...register("priceRange")} placeholder="e.g. $200 - $2,000/year" />
            {errors.priceRange && <p className="text-red-500 text-sm">{errors.priceRange.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} rows={4} />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
        </div>
      </fieldset>
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Contact Information</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input id="contactName" {...register("contactName")} />
            {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input id="contactEmail" type="email" {...register("contactEmail")} />
            {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail.message}</p>}
          </div>
        </div>
      </fieldset>
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Provider Images</legend>
        <div className="space-y-2">
          <Label htmlFor="images">Upload Images</Label>
          <div className="flex flex-col items-center justify-center w-full">
            <label htmlFor="images" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              </div>
              <Input id="images" type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
            </label>
            <div className="flex flex-wrap gap-4 mt-4">
              {imagePreviews.map((src: string, idx: number) => (
                <div key={src} className="relative group">
                  <img src={src} alt={`Preview ${idx + 1}`} className="w-32 h-24 object-cover rounded shadow" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-destructive hover:text-red-600 shadow"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
          {errors.images && <p className="text-red-500 text-sm">{errors.images.message as string}</p>}
        </div>
      </fieldset>
      <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Ad for Review"}
      </Button>
      <Button className="mt-4 w-full" variant="secondary" type="button" onClick={() => window.location.reload()}>
        Back to Ad Type Selection
      </Button>
    </form>
  );
}

function DrivingExperiencesForm({ isSubmitting, setIsSubmitting, images, setImages, imagePreviews, setImagePreviews, currentUser, router, db, storage, MAX_IMAGES }: any) {
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<DrivingExpFormData>({
    resolver: zodResolver(drivingExpSchema),
    defaultValues: { images: [] }
  });
  useEffect(() => { setValue("images", images); }, [images, setValue]);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const newFiles = files.filter(f => !images.some((img: File) => img.name === f.name && img.size === f.size));
    setImages((prev: File[]) => [...prev, ...newFiles].slice(0, MAX_IMAGES));
    setImagePreviews((prev: string[]) => [ ...prev, ...newFiles.map(file => URL.createObjectURL(file)) ].slice(0, MAX_IMAGES));
  };
  const removeImage = (idx: number) => {
    setImages((prev: File[]) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev: string[]) => { URL.revokeObjectURL(prev[idx]); return prev.filter((_, i) => i !== idx); });
  };
  const onSubmit = async (data: DrivingExpFormData) => {
    setIsSubmitting(true);
    try {
      if (!currentUser) {
        alert("You must be logged in to submit an ad.");
        setIsSubmitting(false);
        return;
      }
      if (!images || !Array.isArray(images) || images.length === 0 || !images.every(img => img instanceof File)) {
        alert("Please upload at least one valid image.");
        setIsSubmitting(false);
        return;
      }
      const imageUrls = [];
      for (const file of images) {
        const imageRef = ref(storage, `partner_ads/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      }
      await addDoc(collection(db, "partnerAds"), {
        adType: "Driving Experiences",
        experienceName: data.experienceName,
        experienceType: data.experienceType,
        location: data.location,
        price: data.price,
        description: data.description,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        imageUrls,
        status: "pending",
        submittedAt: new Date(),
        uploadedByUserId: currentUser?.uid || null,
        uploadedByUserEmail: currentUser?.email || null,
      });
      router.push("/partners/dashboard");
    } catch (error) {
      console.error("Error submitting ad:", error);
      alert("Error submitting ad. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Experience Information</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="experienceName">Experience Name</Label>
            <Input id="experienceName" {...register("experienceName")} />
            {errors.experienceName && <p className="text-red-500 text-sm">{errors.experienceName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="experienceType">Experience Type</Label>
            <Input id="experienceType" {...register("experienceType")} placeholder="e.g. Track Day, Rally, Off-Road" />
            {errors.experienceType && <p className="text-red-500 text-sm">{errors.experienceType.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...register("location")} placeholder="e.g. Silverstone Circuit, UK" />
            {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input id="price" {...register("price")} placeholder="e.g. $500" />
            {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} rows={4} />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
        </div>
      </fieldset>
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Contact Information</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input id="contactName" {...register("contactName")} />
            {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input id="contactEmail" type="email" {...register("contactEmail")} />
            {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail.message}</p>}
          </div>
        </div>
      </fieldset>
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Experience Images</legend>
        <div className="space-y-2">
          <Label htmlFor="images">Upload Images</Label>
          <div className="flex flex-col items-center justify-center w-full">
            <label htmlFor="images" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              </div>
              <Input id="images" type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
            </label>
            <div className="flex flex-wrap gap-4 mt-4">
              {imagePreviews.map((src: string, idx: number) => (
                <div key={src} className="relative group">
                  <img src={src} alt={`Preview ${idx + 1}`} className="w-32 h-24 object-cover rounded shadow" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-destructive hover:text-red-600 shadow"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
          {errors.images && <p className="text-red-500 text-sm">{errors.images.message as string}</p>}
        </div>
      </fieldset>
      <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Ad for Review"}
      </Button>
      <Button className="mt-4 w-full" variant="secondary" type="button" onClick={() => window.location.reload()}>
        Back to Ad Type Selection
      </Button>
    </form>
  );
}

function FinanceLeasingStorageForm({ isSubmitting, setIsSubmitting, images, setImages, imagePreviews, setImagePreviews, currentUser, router, db, storage, MAX_IMAGES }: any) {
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FinanceFormData>({
    resolver: zodResolver(financeSchema),
    defaultValues: { images: [] }
  });
  useEffect(() => { setValue("images", images); }, [images, setValue]);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const newFiles = files.filter(f => !images.some((img: File) => img.name === f.name && img.size === f.size));
    setImages((prev: File[]) => [...prev, ...newFiles].slice(0, MAX_IMAGES));
    setImagePreviews((prev: string[]) => [ ...prev, ...newFiles.map(file => URL.createObjectURL(file)) ].slice(0, MAX_IMAGES));
  };
  const removeImage = (idx: number) => {
    setImages((prev: File[]) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev: string[]) => { URL.revokeObjectURL(prev[idx]); return prev.filter((_, i) => i !== idx); });
  };
  const onSubmit = async (data: FinanceFormData) => {
    setIsSubmitting(true);
    try {
      if (!currentUser) {
        alert("You must be logged in to submit an ad.");
        setIsSubmitting(false);
        return;
      }
      if (!images || !Array.isArray(images) || images.length === 0 || !images.every(img => img instanceof File)) {
        alert("Please upload at least one valid image.");
        setIsSubmitting(false);
        return;
      }
      const imageUrls = [];
      for (const file of images) {
        const imageRef = ref(storage, `partner_ads/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      }
      await addDoc(collection(db, "partnerAds"), {
        adType: "Finance / Leasing / Storage",
        serviceName: data.serviceName,
        serviceType: data.serviceType,
        coverageArea: data.coverageArea,
        priceRange: data.priceRange,
        description: data.description,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        imageUrls,
        status: "pending",
        submittedAt: new Date(),
        uploadedByUserId: currentUser?.uid || null,
        uploadedByUserEmail: currentUser?.email || null,
      });
      router.push("/partners/dashboard");
    } catch (error) {
      console.error("Error submitting ad:", error);
      alert("Error submitting ad. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Service Information</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="serviceName">Service Name</Label>
            <Input id="serviceName" {...register("serviceName")} />
            {errors.serviceName && <p className="text-red-500 text-sm">{errors.serviceName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type</Label>
            <Input id="serviceType" {...register("serviceType")} placeholder="e.g. Finance, Leasing, Storage" />
            {errors.serviceType && <p className="text-red-500 text-sm">{errors.serviceType.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="coverageArea">Coverage Area</Label>
            <Input id="coverageArea" {...register("coverageArea")} placeholder="e.g. Nationwide, Europe" />
            {errors.coverageArea && <p className="text-red-500 text-sm">{errors.coverageArea.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="priceRange">Price Range</Label>
            <Input id="priceRange" {...register("priceRange")} placeholder="e.g. $100/month - $2,000/month" />
            {errors.priceRange && <p className="text-red-500 text-sm">{errors.priceRange.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} rows={4} />
          {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
        </div>
      </fieldset>
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Contact Information</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input id="contactName" {...register("contactName")} />
            {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input id="contactEmail" type="email" {...register("contactEmail")} />
            {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail.message}</p>}
          </div>
        </div>
      </fieldset>
      <fieldset className="space-y-6 border-t pt-6">
        <legend className="text-xl font-semibold font-headline">Service Images</legend>
        <div className="space-y-2">
          <Label htmlFor="images">Upload Images</Label>
          <div className="flex flex-col items-center justify-center w-full">
            <label htmlFor="images" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              </div>
              <Input id="images" type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
            </label>
            <div className="flex flex-wrap gap-4 mt-4">
              {imagePreviews.map((src: string, idx: number) => (
                <div key={src} className="relative group">
                  <img src={src} alt={`Preview ${idx + 1}`} className="w-32 h-24 object-cover rounded shadow" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-destructive hover:text-red-600 shadow"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
          {errors.images && <p className="text-red-500 text-sm">{errors.images.message as string}</p>}
        </div>
      </fieldset>
      <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Ad for Review"}
      </Button>
      <Button className="mt-4 w-full" variant="secondary" type="button" onClick={() => window.location.reload()}>
        Back to Ad Type Selection
      </Button>
    </form>
  );
} 