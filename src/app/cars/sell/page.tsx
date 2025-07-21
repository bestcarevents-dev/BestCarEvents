"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UploadCloud } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const carFeatures = ["Air Conditioning", "Power Steering", "Power Windows", "Sunroof/Moonroof", "Navigation System", "Bluetooth", "Backup Camera", "Leather Seats", "Heated Seats"] as const;

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
  images: z.array(z.instanceof(File)).refine(files => files.length > 0, "At least one image is required")
});

type CarFormData = z.infer<typeof carSchema>;

export default function SellCarPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const db = getFirestore(app);
  const storage = getStorage(app);

  const { control, register, handleSubmit, formState: { errors } } = useForm<CarFormData>({
    resolver: zodResolver(carSchema),
    defaultValues: {
        features: [],
    }
  });

  const onSubmit = async (data: CarFormData) => {
    setIsSubmitting(true);
    try {
      const imageUrls = [];
      // Access files from the form data
      const files = data.images;

      // Validate files length
      if (files.length === 0) {
          // Handle error: no files selected
          setIsSubmitting(false);
          return;
      }

      for (const file of Array.from(files)) {
        const imageRef = ref(storage, `car_images/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        const imageUrl = await getDownloadURL(imageRef);
        imageUrls.push(imageUrl);
      }

      await addDoc(collection(db, "pendingCars"), {
        ...data,
        images: imageUrls,
        status: "pending",
        submittedAt: new Date(),
      });

      router.push("/cars/submission-success");
    } catch (error) {
      console.error("Error submitting car:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
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
                     <div className="flex items-center justify-center w-full">
                        <label htmlFor="images" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">Upload up to 10 high-quality images</p>
                            </div>
                            <Input id="images" type="file" className="hidden" {...register("images")} multiple />
                        </label>
                    </div>
                    {errors.images && <p className="text-red-500 text-sm">{errors.images.message as string}</p>}
                </div>
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
