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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createEventRequestNotification } from "@/lib/notifications";
import TagInput from "@/components/form/TagInput";
import LocationPicker, { type LocationData } from "@/components/LocationPicker";

const eventSchema = z.object({
  eventName: z.string().min(5, "Event name must be at least 5 characters"),
  eventDate: z.date({ required_error: "Event date is required" }),
  location: z.string().min(5, "Location is required"),
  locationData: z.custom<LocationData>((v) => !!v && typeof v === 'object').refine((v: any) => v?.formattedAddress && typeof v.latitude === 'number' && typeof v.longitude === 'number', {
    message: "Please select a valid location from suggestions or map",
  }),
  description: z.string().min(20, "Description must be at least 20 characters"),
  organizerName: z.string().min(3, "Organizer name is required"),
  organizerContact: z.string().email("Invalid email address"),
  image: z
    .any()
    .refine(
      (file) => typeof window === "undefined" || (file instanceof File && file.size > 0),
      "Image is required"
    ),
  
  // New Fields for Comprehensive Event Details
  eventType: z.enum(["Car Show", "Race", "Meetup", "Rally", "Other"], { required_error: "Event type is required" }),
  vehicleFocus: z.string().optional(), // e.g., Classic Cars, JDM, Muscle Cars, Electric Vehicles
  expectedAttendance: z.number().int().positive("Expected attendance must be a positive number").optional(),
  entryFee: z.number().positive("Entry fee must be a positive number").optional().or(z.literal(0)),
  scheduleHighlights: z.string().optional(),
  activities: z.string().optional(),
  rulesUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  sponsors: z.string().optional(),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function HostEventPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();
  const db = getFirestore(app);
  const storage = getStorage(app);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { control, register, handleSubmit, formState: { errors }, setValue, watch } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  // Watch for image changes and update preview
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // Get current user
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    try {
      const imageRef = ref(storage, `event_images/${Date.now()}_${data.image.name}`);
      await uploadBytes(imageRef, data.image);
      const imageUrl = await getDownloadURL(imageRef);

      const eventData = {
        eventName: data.eventName,
        eventDate: data.eventDate,
        location: data.location,
        locationData: data.locationData,
        description: data.description,
        organizerName: data.organizerName,
        organizerContact: data.organizerContact,
        imageUrl,
        eventType: data.eventType,
        vehicleFocus: data.vehicleFocus,
        expectedAttendance: data.expectedAttendance,
        entryFee: data.entryFee,
        scheduleHighlights: data.scheduleHighlights,
        activities: data.activities,
        rulesUrl: data.rulesUrl,
        sponsors: data.sponsors,
        websiteUrl: data.websiteUrl,
        status: "pending",
        submittedAt: new Date(),
        uploadedByUserId: currentUser?.uid || null,
        uploadedByUserEmail: currentUser?.email || null,
      };

      const docRef = await addDoc(collection(db, "pendingEvents"), eventData);
      
      // Create notification (non-blocking)
      try {
        await createEventRequestNotification({
          ...eventData,
          id: docRef.id,
          userId: currentUser?.uid || null
        });
      } catch (notificationError) {
        console.error('Error creating event notification:', notificationError);
        // Don't fail the submission if notification fails
      }

      router.push("/events/submission-success");
    } catch (error) {
      console.error("Error submitting event:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-3xl mx-auto bg-white border border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-3xl font-bold font-headline text-gray-900">Host an Event</CardTitle>
            <CardDescription className="text-gray-600">Fill out the form below to submit your event for approval.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Existing Fields */}
              <div className="space-y-2">
                <Label htmlFor="eventName" className="text-gray-700 font-medium">Event Name</Label>
                <Input id="eventName" {...register("eventName")} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                {errors.eventName && <p className="text-red-500 text-sm">{errors.eventName.message}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="eventDate" className="text-gray-700 font-medium">Event Date</Label>
                    <Controller
                        name="eventDate"
                        control={control}
                        render={({ field }) => (
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
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        )}
                    />
                    {errors.eventDate && <p className="text-red-500 text-sm">{errors.eventDate.message as string}</p>}
                  </div>
                  <div className="space-y-2">
                    <LocationPicker
                      label="Location"
                      required
                      initialValue={watch("locationData") as any}
                      onChange={(value) => {
                        setValue("locationData", value as any, { shouldValidate: true });
                        setValue("location", value?.formattedAddress || "", { shouldValidate: true });
                      }}
                    />
                    {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
                    {errors.locationData && <p className="text-red-500 text-sm">{String((errors as any).locationData?.message || "Location selection required")}</p>}
                  </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700 font-medium">Event Description</Label>
                <Textarea id="description" {...register("description")} rows={5} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
              </div>

              {/* New Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <Label className="text-gray-700 font-medium">Event Type</Label>
                      <Controller
                          name="eventType"
                          control={control}
                          render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:border-yellow-400 focus:ring-yellow-400"><SelectValue placeholder="Select event type" /></SelectTrigger>
                                  <SelectContent className="bg-white border border-gray-200 text-gray-900">
                                      <SelectItem value="Car Show">Car Show</SelectItem>
                                      <SelectItem value="Race">Race</SelectItem>
                                      <SelectItem value="Meetup">Meetup</SelectItem>
                                      <SelectItem value="Rally">Rally</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                              </Select>
                          )}
                      />
                      {errors.eventType && <p className="text-red-500 text-sm">{errors.eventType.message}</p>}
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="vehicleFocus" className="text-gray-700 font-medium">Vehicle Focus (Optional)</Label>
                      <Input id="vehicleFocus" {...register("vehicleFocus")} placeholder="e.g., Classic Cars, JDM" className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"/>
                      {errors.vehicleFocus && <p className="text-red-500 text-sm">{errors.vehicleFocus.message}</p>}
                  </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <Label htmlFor="expectedAttendance" className="text-gray-700 font-medium">Expected Attendance (Optional)</Label>
                      <Input id="expectedAttendance" type="number" {...register("expectedAttendance", { valueAsNumber: true })} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                      {errors.expectedAttendance && <p className="text-red-500 text-sm">{errors.expectedAttendance.message}</p>}
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="entryFee" className="text-gray-700 font-medium">Entry Fee (USD - Optional)</Label>
                      <Input id="entryFee" type="number" {...register("entryFee", { valueAsNumber: true })} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400" />
                      {errors.entryFee && <p className="text-red-500 text-sm">{errors.entryFee.message}</p>}
                  </div>
              </div>

              <div className="space-y-2">
                  <Label htmlFor="scheduleHighlights" className="text-gray-700 font-medium">Schedule Highlights (Optional)</Label>
                  <Textarea id="scheduleHighlights" {...register("scheduleHighlights")} rows={3} placeholder="e.g., 9:00 AM - Gates Open&#10;11:00 AM - Car Judging Begins&#10;3:00 PM - Awards Ceremony" className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"/>
                  {errors.scheduleHighlights && <p className="text-red-500 text-sm">{errors.scheduleHighlights.message}</p>}
              </div>

              <div className="space-y-2">
                  <Label htmlFor="activities" className="text-gray-700 font-medium">Specific Activities (Optional)</Label>
                  <Controller
                    name="activities"
                    control={control}
                    render={({ field }) => (
                      <TagInput
                        value={field.value as any}
                        onChange={field.onChange}
                        placeholder="Type an activity and press Enter (e.g., Live Music)"
                        helperText="Press Enter after each activity."
                      />
                    )}
                  />
                  {errors.activities && <p className="text-red-500 text-sm">{errors.activities.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <Label htmlFor="rulesUrl" className="text-gray-700 font-medium">Rules and Regulations URL (Optional)</Label>
                      <Input id="rulesUrl" {...register("rulesUrl")} placeholder="https://example.com/rules" className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"/>
                      {errors.rulesUrl && <p className="text-red-500 text-sm">{errors.rulesUrl.message}</p>}
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="websiteUrl" className="text-gray-700 font-medium">Event Website or Social Media URL (Optional)</Label>
                      <Input id="websiteUrl" {...register("websiteUrl")} placeholder="https://example.com/event" className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"/>
                      {errors.websiteUrl && <p className="text-red-500 text-sm">{errors.websiteUrl.message}</p>}
                  </div>
              </div>

              <div className="space-y-2">
                  <Label htmlFor="sponsors" className="text-gray-700 font-medium">Sponsors (Optional)</Label>
                  <Controller
                    name="sponsors"
                    control={control}
                    render={({ field }) => (
                      <TagInput
                        value={field.value as any}
                        onChange={field.onChange}
                        placeholder="Type a sponsor name and press Enter"
                        helperText="Press Enter after each sponsor."
                      />
                    )}
                  />
                  {errors.sponsors && <p className="text-red-500 text-sm">{errors.sponsors.message}</p>}
              </div>

              {/* Existing Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image" className="text-gray-700 font-medium">Event Image</Label>
                <div className="flex flex-col items-center justify-center w-full">
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="mb-4 rounded-lg max-h-48 object-contain border border-gray-200" />
                  )}
                  <label htmlFor="image" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-600"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 800x400px)</p>
                    </div>
                    <Controller
                      name="image"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="image"
                          type="file"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files ? e.target.files[0] : null;
                            field.onChange(file);
                            if (file) {
                              setImagePreview(URL.createObjectURL(file));
                            } else {
                              setImagePreview(null);
                            }
                          }}
                        />
                      )}
                    />
                  </label>
                </div>
                {errors.image && <p className="text-red-500 text-sm">{errors.image.message as string}</p>}
              </div>

              {/* Existing Organizer Info */}
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

              <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600 focus:ring-yellow-400" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit for Approval"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
