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
import { UploadCloud, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const auctionSchema = z.object({
  auctionName: z.string().min(5, "Auction name is required"),
  auctionHouse: z.string().min(2, "Auction house name is required"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  
  // Location
  address: z.string().min(10, "A detailed address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State/Province is required"),
  country: z.string().min(2, "Country is required"),
  
  // Details
  description: z.string().min(20, "A detailed description of the auction event is required"),
  auctionType: z.enum(["Online", "In-Person", "Hybrid"]),
  registrationLink: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  viewingTimes: z.string().optional(),

  // Organizer Info
  organizerName: z.string().min(3, "Organizer name is required"),
  organizerContact: z.string().email("Invalid email address"),
  
  // Media
  image: z.instanceof(File).refine(file => file.size > 0, "An image of the venue or a poster is required"),
});

type AuctionFormData = z.infer<typeof auctionSchema>;

export default function RegisterAuctionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const db = getFirestore(app);
  const storage = getStorage(app);

  const { control, register, handleSubmit, formState: { errors } } = useForm<AuctionFormData>({
    resolver: zodResolver(auctionSchema),
  });

  const onSubmit = async (data: AuctionFormData) => {
    setIsSubmitting(true);
    try {
      const imageRef = ref(storage, `auction_venues/${Date.now()}_${data.image.name}`);
      await uploadBytes(imageRef, data.image);
      const imageUrl = await getDownloadURL(imageRef);

      await addDoc(collection(db, "pendingAuctions"), {
        ...data,
        imageUrl,
        status: "pending",
        submittedAt: new Date(),
      });

      router.push("/auctions/submission-success");
    } catch (error) {
      console.error("Error submitting auction:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline text-primary">Register Your Auction Event</CardTitle>
          <CardDescription>Provide details about your upcoming auction for our team to review and list on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Auction Details</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="auctionName">Auction Name</Label>
                        <Input id="auctionName" {...register("auctionName")} />
                        {errors.auctionName && <p className="text-red-500 text-sm">{errors.auctionName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="auctionHouse">Auction House</Label>
                        <Input id="auctionHouse" {...register("auctionHouse")} />
                        {errors.auctionHouse && <p className="text-red-500 text-sm">{errors.auctionHouse.message}</p>}
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Controller name="startDate" control={control} render={({ field }) => (
                            <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                        )} />
                        {errors.startDate && <p className="text-red-500 text-sm">{errors.startDate.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label>End Date</Label>
                        <Controller name="endDate" control={control} render={({ field }) => (
                            <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                        )} />
                        {errors.endDate && <p className="text-red-500 text-sm">{errors.endDate.message}</p>}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Auction Description</Label>
                    <Textarea id="description" {...register("description")} rows={5} />
                    {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                </div>
            </fieldset>

            <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Location & Venue</legend>
                 <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input id="address" {...register("address")} />
                    {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            </fieldset>

            <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Registration & Logistics</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label>Auction Type</Label>
                        <Controller name="auctionType" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent><SelectItem value="Online">Online</SelectItem><SelectItem value="In-Person">In-Person</SelectItem><SelectItem value="Hybrid">Hybrid</SelectItem></SelectContent></Select>
                        )} />
                        {errors.auctionType && <p className="text-red-500 text-sm">{errors.auctionType.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="registrationLink">Registration Link (URL)</Label>
                        <Input id="registrationLink" {...register("registrationLink")} placeholder="https://example.com/register" />
                        {errors.registrationLink && <p className="text-red-500 text-sm">{errors.registrationLink.message}</p>}
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="viewingTimes">Public Viewing Times</Label>
                    <Textarea id="viewingTimes" {...register("viewingTimes")} rows={3} placeholder="e.g., Friday, Oct 25: 10am - 6pm&#10;Saturday, Oct 26: 9am - 1pm"/>
                    {errors.viewingTimes && <p className="text-red-500 text-sm">{errors.viewingTimes.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="image">Venue Image or Event Poster</Label>
                     <div className="flex items-center justify-center w-full">
                        <label htmlFor="image" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            </div>
                            <Controller name="image" control={control} render={({ field }) => <Input id="image" type="file" className="hidden" onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} />} />
                        </label>
                    </div>
                    {errors.image && <p className="text-red-500 text-sm">{errors.image.message as string}</p>}
                </div>
            </fieldset>

             <fieldset className="space-y-6 border-t pt-6">
                <legend className="text-xl font-semibold font-headline">Organizer Information</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="organizerName">Your Name</Label>
                        <Input id="organizerName" {...register("organizerName")} />
                        {errors.organizerName && <p className="text-red-500 text-sm">{errors.organizerName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="organizerContact">Your Contact Email</Label>
                        <Input id="organizerContact" type="email" {...register("organizerContact")} />
                        {errors.organizerContact && <p className="text-red-500 text-sm">{errors.organizerContact.message}</p>}
                    </div>
                </div>
            </fieldset>

            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Auction for Approval"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
