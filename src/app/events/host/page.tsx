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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const eventSchema = z.object({
  eventName: z.string().min(5, "Event name must be at least 5 characters"),
  eventDate: z.date({ required_error: "Event date is required" }),
  location: z.string().min(5, "Location is required"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  organizerName: z.string().min(3, "Organizer name is required"),
  organizerContact: z.string().email("Invalid email address"),
  image: z.instanceof(File).refine(file => file.size > 0, "Image is required"),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function HostEventPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const db = getFirestore(app);
  const storage = getStorage(app);

  const { control, register, handleSubmit, formState: { errors } } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    try {
      const imageRef = ref(storage, `event_images/${Date.now()}_${data.image.name}`);
      await uploadBytes(imageRef, data.image);
      const imageUrl = await getDownloadURL(imageRef);

      await addDoc(collection(db, "pendingEvents"), {
        ...data,
        imageUrl,
        status: "pending",
        submittedAt: new Date(),
      });

      router.push("/events/submission-success");
    } catch (error) {
      console.error("Error submitting event:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline text-primary">Host an Event</CardTitle>
          <CardDescription>Fill out the form below to submit your event for approval.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name</Label>
              <Input id="eventName" {...register("eventName")} />
              {errors.eventName && <p className="text-red-500 text-sm">{errors.eventName.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Controller
                      name="eventDate"
                      control={control}
                      render={({ field }) => (
                          <Popover>
                              <PopoverTrigger asChild>
                                  <Button
                                      variant={"outline"}
                                      className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                      )}
                                  >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
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
                  {errors.eventDate && <p className="text-red-500 text-sm">{errors.eventDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" {...register("location")} />
                  {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Event Description</Label>
              <Textarea id="description" {...register("description")} rows={5} />
              {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="image">Event Image</Label>
              <div className="flex items-center justify-center w-full">
                  <label htmlFor="image" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG or GIF (MAX. 800x400px)</p>
                      </div>
                      <Controller
                          name="image"
                          control={control}
                          render={({ field }) => <Input id="image" type="file" className="hidden" onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} />}
                      />
                  </label>
              </div>
              {errors.image && <p className="text-red-500 text-sm">{errors.image.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
