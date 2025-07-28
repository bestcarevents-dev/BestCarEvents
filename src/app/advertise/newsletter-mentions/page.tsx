"use client";

import { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, addDoc, query, where } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Plus, AlertTriangle, Upload, X } from "lucide-react";

interface NewsletterRequest {
  id: string;
  type: "standard" | "premium";
  title: string;
  description: string;
  websiteUrl?: string;
  images: string[];
  status: "pending" | "approved" | "rejected";
  createdAt: any;
  uploadedByUser: string;
  uploadedByUserEmail: string;
}

interface UserDoc {
  standardNewsletterRemaining?: number;
  premiumNewsletterRemaining?: number;
  [key: string]: any;
}

export default function NewsletterMentionsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previousRequests, setPreviousRequests] = useState<NewsletterRequest[]>([]);
  
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    description: "",
    websiteUrl: "",
    images: [] as File[]
  });

  const router = useRouter();
  const db = getFirestore(app);
  const storage = getStorage(app);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authChecked || !currentUser) return;
    
    const fetchData = async () => {
      setLoading(true);
      
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserDoc(userSnap.exists() ? userSnap.data() as UserDoc : null);
      
      const requestsQuery = query(
        collection(db, "newsletterrequests"),
        where("uploadedByUserEmail", "==", currentUser.email)
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const requestsData = requestsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as NewsletterRequest));
      setPreviousRequests(requestsData);
      
      setLoading(false);
    };
    
    fetchData();
  }, [currentUser, authChecked]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxImages = formData.type === "premium" ? 4 : 1;
    
    if (formData.images.length + files.length > maxImages) {
      alert(`You can only upload up to ${maxImages} image${maxImages > 1 ? 's' : ''} for ${formData.type} newsletter.`);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleFileButtonClick = () => {
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleSubmit = async () => {
    if (!formData.type || !formData.title || !formData.description) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.images.length === 0) {
      alert("Please upload at least one image");
      return;
    }

    const quotaField = formData.type === "premium" ? "premiumNewsletterRemaining" : "standardNewsletterRemaining";
    if (!userDoc || (userDoc[quotaField] ?? 0) <= 0) {
      alert(`You don't have enough ${formData.type === "premium" ? "Premium" : "Standard"} Newsletter Credit remaining.`);
      return;
    }

    setSubmitting(true);
    
    try {
      // Upload images to Firebase Storage
      const imageUrls: string[] = [];
      for (let i = 0; i < formData.images.length; i++) {
        const imageRef = ref(storage, `newsletter_images/${currentUser.uid}/${Date.now()}-${formData.images[i].name}`);
        await uploadBytes(imageRef, formData.images[i]);
        const downloadURL = await getDownloadURL(imageRef);
        imageUrls.push(downloadURL);
      }

      const newsletterRequest = {
        type: formData.type,
        title: formData.title,
        description: formData.description,
        websiteUrl: formData.websiteUrl || "",
        images: imageUrls,
        status: "pending",
        createdAt: new Date(),
        uploadedByUser: currentUser.displayName || currentUser.email,
        uploadedByUserEmail: currentUser.email
      };

      await addDoc(collection(db, "newsletterrequests"), newsletterRequest);

      await updateDoc(doc(db, "users", currentUser.uid), {
        [quotaField]: (userDoc[quotaField] ?? 0) - 1
      });

      setUserDoc((prev: UserDoc | null) => prev ? {
        ...prev,
        [quotaField]: (prev[quotaField] ?? 0) - 1
      } : null);

      setFormData({
        type: "",
        title: "",
        description: "",
        websiteUrl: "",
        images: []
      });
      setShowForm(false);

      const requestsQuery = query(
        collection(db, "newsletterrequests"),
        where("uploadedByUserEmail", "==", currentUser.email)
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const requestsData = requestsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as NewsletterRequest));
      setPreviousRequests(requestsData);

    } catch (error) {
      console.error("Error submitting newsletter request:", error);
      alert("Error submitting request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!currentUser) {
    return <div className="flex items-center justify-center h-64">Please log in to access this page.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">Newsletter Mentions</h1>
        <Button onClick={() => router.push("/advertise/dashboard")} variant="outline">
          Buy More Credit
        </Button>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Your Newsletter Credit</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Standard Newsletter
              </CardTitle>
              <CardDescription>
                Brief mention with one image and a link to your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">
                  {userDoc?.standardNewsletterRemaining || 0}
                </p>
                <p className="text-sm text-muted-foreground">Remaining</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Premium Newsletter
              </CardTitle>
              <CardDescription>
                Dedicated section with images (up to 4), description and website link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">
                  {userDoc?.premiumNewsletterRemaining || 0}
                </p>
                <p className="text-sm text-muted-foreground">Remaining</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Create Newsletter Request</h2>
          <Button 
            onClick={() => setShowForm(true)} 
            disabled={!userDoc || ((userDoc.standardNewsletterRemaining ?? 0) <= 0 && (userDoc.premiumNewsletterRemaining ?? 0) <= 0)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>

        {!userDoc || ((userDoc.standardNewsletterRemaining ?? 0) <= 0 && (userDoc.premiumNewsletterRemaining ?? 0) <= 0) ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have any newsletter Credit remaining. Please purchase more Credit from the dashboard.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Previous Requests</h2>
        {previousRequests.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No newsletter requests yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previousRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Badge variant={request.type === "premium" ? "default" : "secondary"}>
                        {request.type === "premium" ? "Premium" : "Standard"}
                      </Badge>
                    </TableCell>
                    <TableCell>{request.title}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          request.status === "approved" ? "default" : 
                          request.status === "rejected" ? "destructive" : "secondary"
                        }
                      >
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.createdAt?.seconds 
                        ? new Date(request.createdAt.seconds * 1000).toLocaleDateString()
                        : "N/A"
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Newsletter Request</DialogTitle>
            <DialogDescription>
              Fill in the details for your newsletter mention request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">Newsletter Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value, images: [] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select newsletter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard" disabled={!userDoc || (userDoc.standardNewsletterRemaining ?? 0) <= 0}>
                    Standard Newsletter ({userDoc?.standardNewsletterRemaining || 0} remaining)
                  </SelectItem>
                  <SelectItem value="premium" disabled={!userDoc || (userDoc.premiumNewsletterRemaining ?? 0) <= 0}>
                    Premium Newsletter ({userDoc?.premiumNewsletterRemaining || 0} remaining)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter the title for your newsletter mention"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter the description for your newsletter mention"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                placeholder="https://your-website.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Images</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">
                  {formData.type === "premium" 
                    ? "Upload up to 4 images for premium newsletter" 
                    : "Upload 1 image for standard newsletter"
                  }
                </p>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={handleFileButtonClick}
                  className="cursor-pointer"
                >
                  Choose Files
                </Button>
              </div>
              
              {formData.images.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Selected Images ({formData.images.length}):</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {formData.images.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-0 right-0 w-6 h-6 p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 