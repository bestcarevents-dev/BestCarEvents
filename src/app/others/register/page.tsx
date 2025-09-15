"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, addDoc, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Upload, MapPin, Phone, Mail, Globe, Clock, DollarSign, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createServiceRequestNotification } from "@/lib/notifications";
import TagInput from "@/components/form/TagInput";
import LocationPicker, { type LocationData } from "@/components/LocationPicker";
import { Switch } from "@/components/ui/switch";

const serviceSchema = z.object({
  serviceName: z.string().min(2, "Service name must be at least 2 characters"),
  serviceType: z.string().min(1, "Please select a service type"),
  description: z.string().min(20, "Description must be at least 20 characters"),
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
  priceRange: z.string().min(1, "Price range is required"),
  contactInfo: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  coverageArea: z.string().optional(),
  businessHours: z.string().optional(),
  specializations: z.string().optional(),
  experience: z.string().optional(),
  certifications: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

const serviceTypes = [
  { value: "car-storage", label: "Car Storage", description: "Secure storage facilities for vehicles" },
  { value: "garage", label: "Garage Services", description: "Mechanical and repair services" },
  { value: "spare-parts", label: "Spare Parts", description: "New and used automotive parts" },
  { value: "restoration", label: "Restoration", description: "Classic car restoration services" },
  { value: "detailing", label: "Detailing", description: "Car cleaning and detailing services" },
  { value: "wrapping", label: "Wrapping & Vinyl", description: "Vehicle wrapping and vinyl services" },
  { value: "towing", label: "Towing Services", description: "Vehicle towing and recovery" },
  { value: "transport", label: "Transport", description: "Vehicle transport and shipping" },
  { value: "insurance", label: "Insurance", description: "Automotive insurance services" },
  { value: "finance", label: "Finance", description: "Vehicle financing and leasing" },
  { value: "consulting", label: "Consulting", description: "Automotive consulting services" },
  { value: "other", label: "Other", description: "Other automotive services" },
];

export default function RegisterServicePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      privacyMode: false,
    }
  });

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length + images.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }

    setImages(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ServiceFormData) => {
    if (!currentUser) return;

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const db = getFirestore(app);
      const storage = getStorage(app);
      const imageUrls: string[] = [];

      // Upload images
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const storageRef = ref(storage, `others/${currentUser.uid}/${Date.now()}_${image.name}`);
        await uploadBytes(storageRef, image);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
        setUploadProgress(((i + 1) / images.length) * 100);
      }

      // Create service document
      const serviceData = {
        ...data,
        imageUrls,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        status: "pending",
        submittedAt: new Date(),
        createdAt: new Date(),
        privacyMode: !!(data as any).privacyMode,
      };

      const docRef = await addDoc(collection(db, "pendingOthers"), serviceData);
      
      // Create notification (non-blocking)
      try {
        await createServiceRequestNotification({
          ...serviceData,
          id: docRef.id
        });
      } catch (notificationError) {
        console.error('Error creating service notification:', notificationError);
        // Don't fail the submission if notification fails
      }

      router.push("/others/submission-success");
    } catch (error) {
      console.error("Error submitting service:", error);
      alert("Failed to submit service. Please try again.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-4xl mx-auto bg-white border border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-3xl font-bold font-headline text-gray-900">Register Your Service</CardTitle>
            <CardDescription className="text-gray-600">
              Share your automotive service with our community. Whether it's storage, restoration, detailing, or any other service, we want to help you connect with car enthusiasts.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Service Information */}
              <fieldset className="space-y-6 border-t border-gray-200 pt-6">
                <legend className="text-xl font-semibold font-headline text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-yellow-600" />
                  Service Information
                </legend>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="serviceName" className="text-gray-700 font-medium">Service Name *</Label>
                    <Input 
                      id="serviceName" 
                      {...register("serviceName")} 
                      placeholder="e.g., Premium Car Storage, Classic Restoration Pro"
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" 
                    />
                    {errors.serviceName && <p className="text-red-500 text-sm">{errors.serviceName.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="serviceType" className="text-gray-700 font-medium">Service Type *</Label>
                    <Select onValueChange={(value) => setValue("serviceType", value)}>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:border-yellow-400 focus:ring-yellow-400">
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-gray-500">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.serviceType && <p className="text-red-500 text-sm">{errors.serviceType.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-700 font-medium">Detailed Description *</Label>
                  <Textarea 
                    id="description" 
                    {...register("description")} 
                    rows={5} 
                    placeholder="Describe your services, expertise, and what makes you unique. Include details about your experience, equipment, and approach."
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
                  />
                  {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Location *</Label>
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
                  <Label htmlFor="privacyMode" className="text-gray-700">Privacy mode</Label>
                </div>
                <p className="text-xs text-gray-500 -mt-2">If enabled, your exact address will be hidden on the public page. Only your city/state will be shown.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="addressLine" className="text-gray-700 font-medium">Address</Label>
                    <Input id="addressLine" {...register("addressLine")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                    {errors.addressLine && <p className="text-red-500 text-sm">{errors.addressLine.message}</p>}
                  </div>
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

              {/* Contact Information */}
              <fieldset className="space-y-6 border-t border-gray-200 pt-6">
                <legend className="text-xl font-semibold font-headline text-gray-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-yellow-600" />
                  Contact Information
                </legend>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contactInfo" className="text-gray-700 font-medium">Email Address *</Label>
                    <Input 
                      id="contactInfo" 
                      {...register("contactInfo")} 
                      type="email"
                      placeholder="contact@yourservice.com"
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" 
                    />
                    {errors.contactInfo && <p className="text-red-500 text-sm">{errors.contactInfo.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-gray-700 font-medium">Phone Number</Label>
                    <Input 
                      id="phoneNumber" 
                      {...register("phoneNumber")} 
                      placeholder="+1 (555) 123-4567"
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" 
                    />
                    {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl" className="text-gray-700 font-medium">Website URL</Label>
                  <Input 
                    id="websiteUrl" 
                    {...register("websiteUrl")} 
                    placeholder="https://yourservice.com"
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" 
                  />
                  {errors.websiteUrl && <p className="text-red-500 text-sm">{errors.websiteUrl.message}</p>}
                </div>
              </fieldset>

              {/* Additional Information */}
              <fieldset className="space-y-6 border-t border-gray-200 pt-6">
                <legend className="text-xl font-semibold font-headline text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  Additional Information
                </legend>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="coverageArea" className="text-gray-700 font-medium">Coverage Area</Label>
                    <Input 
                      id="coverageArea" 
                      {...register("coverageArea")} 
                      placeholder="e.g., Greater London, Nationwide, Europe"
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" 
                    />
                    {errors.coverageArea && <p className="text-red-500 text-sm">{errors.coverageArea.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessHours" className="text-gray-700 font-medium">Business Hours</Label>
                    <Input 
                      id="businessHours" 
                      {...register("businessHours")} 
                      placeholder="e.g., Mon-Fri 9AM-6PM, Sat 10AM-4PM"
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" 
                    />
                    {errors.businessHours && <p className="text-red-500 text-sm">{errors.businessHours.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="specializations" className="text-gray-700 font-medium">Specializations</Label>
                    <TagInput
                      // react-hook-form cannot control custom without Controller here; we set manually via register fallback
                      value={watch("specializations") as any}
                      onChange={(v) => setValue("specializations", v)}
                      placeholder="Type a specialization and press Enter"
                      helperText="Press Enter after each specialization."
                    />
                    {errors.specializations && <p className="text-red-500 text-sm">{errors.specializations.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-gray-700 font-medium">Years of Experience</Label>
                    <Input 
                      id="experience" 
                      {...register("experience")} 
                      placeholder="e.g., 15+ years, Since 1995"
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" 
                    />
                    {errors.experience && <p className="text-red-500 text-sm">{errors.experience.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certifications" className="text-gray-700 font-medium">Certifications & Awards</Label>
                  <Textarea 
                    id="certifications" 
                    {...register("certifications")} 
                    rows={3}
                    placeholder="List any relevant certifications, awards, or memberships that demonstrate your expertise."
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
                  />
                  {errors.certifications && <p className="text-red-500 text-sm">{errors.certifications.message}</p>}
                </div>
              </fieldset>

              {/* Image Upload */}
              <fieldset className="space-y-6 border-t border-gray-200 pt-6">
                <legend className="text-xl font-semibold font-headline text-gray-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-yellow-600" />
                  Service Images
                </legend>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB (max 5 images)</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        multiple 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadProgress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-yellow-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </fieldset>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 text-lg font-semibold"
                >
                  {isSubmitting ? "Submitting..." : "Submit Service Registration"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 