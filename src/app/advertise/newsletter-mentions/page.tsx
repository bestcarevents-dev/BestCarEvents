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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Plus, AlertTriangle, Upload, X } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  // Payment modal state
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedNewsletterType, setSelectedNewsletterType] = useState<'standard' | 'premium' | null>(null);
  const [paymentStep, setPaymentStep] = useState<'selectType' | 'selectPayment' | 'pay'>('selectType');
  const [selectedPayment, setSelectedPayment] = useState<'stripe' | 'paypal' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "AW2LLf5-BoTh1ZUKUhs8Ic7nmIfH49BV92y-960SIzcvrO4vlDpLtNKe--xYpNB9Yb3xn7XONXJbErNv",
    currency: "EUR",
    intent: "capture",
  };
  const NEWSLETTER_PRICES = {
    premium: 600, // EUR
    standard: 400, // EUR
  };

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

  // Handle success/cancel from Stripe checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === '1') {
      toast({
        title: "Payment Successful!",
        description: "Your newsletter credit has been added to your account.",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (canceled === '1') {
      toast({
        title: "Payment Canceled",
        description: "Your payment was canceled. You can try again anytime.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

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

  // Payment handlers
  const handlePayment = async () => {
    setProcessing(true);
    setPaymentError(null);
    let amount = 0;
    let description = '';
    if (selectedNewsletterType) {
      amount = NEWSLETTER_PRICES[selectedNewsletterType];
      description = selectedNewsletterType === 'premium' ? 'Premium Newsletter Mention' : 'Standard Newsletter Mention';
    }
    if (!amount || !description) {
      setPaymentError('Invalid payment details.');
      setProcessing(false);
      return;
    }
    if (selectedPayment === 'stripe') {
      // Call API to create Stripe Checkout session
      const res = await fetch('/api/payment/stripe-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount, 
          description, 
          email: currentUser?.email,
          returnUrl: window.location.href
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
        return;
      } else {
        setPaymentError(data.error || 'Failed to create Stripe Checkout session.');
      }
      setProcessing(false);
    } else if (selectedPayment === 'paypal') {
      // Call API to create PayPal order
      const res = await fetch('/api/payment/paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description }),
      });
      const data = await res.json();
      if (data.orderId) {
        setPaymentStep('pay');
      } else {
        setPaymentError(data.error || 'Failed to create PayPal order.');
      }
      setProcessing(false);
    }
  };
  // PayPal handlers
  const createPayPalOrder = async (data: any, actions: any) => {
    let amount = 0;
    let description = '';
    if (selectedNewsletterType) {
      amount = NEWSLETTER_PRICES[selectedNewsletterType];
      description = selectedNewsletterType === 'premium' ? 'Premium Newsletter Mention' : 'Standard Newsletter Mention';
    }
    if (!amount || !description) {
      throw new Error('Invalid payment details');
    }
    const res = await fetch('/api/payment/paypal-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description }),
    });
    const orderData = await res.json();
    if (!orderData.orderId) {
      throw new Error(orderData.error || 'Failed to create PayPal order');
    }
    return orderData.orderId;
  };
  const onPayPalApprove = async (data: any, actions: any) => {
    try {
      const res = await fetch('/api/payment/paypal-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderID }),
      });
      const captureData = await res.json();
      if (captureData.success) {
        await handlePostPayment();
        return Promise.resolve();
      } else {
        throw new Error(captureData.error || 'Payment capture failed');
      }
    } catch (error: any) {
      setPaymentError(error.message || 'Payment failed');
      return Promise.reject(error);
    }
  };
  const onPayPalError = (err: any) => {
    setPaymentError('PayPal error: ' + (err?.message || 'Unknown error'));
  };
  // Post-payment handler
  const handlePostPayment = async () => {
    if (!selectedNewsletterType) return;
    const db = getFirestore(app);
    // Increment the user's Credit
    const quotaField = selectedNewsletterType === 'premium' ? 'premiumNewsletterRemaining' : 'standardNewsletterRemaining';
    await updateDoc(doc(db, "users", currentUser!.uid), {
      [quotaField]: (userDoc?.[quotaField] || 0) + 1
    });
    setUserDoc((prev: UserDoc | null) => prev ? {
      ...prev,
      [quotaField]: (prev[quotaField] || 0) + 1
    } : null);
    setPaymentModal(false);
    setSelectedNewsletterType(null);
    setPaymentStep('selectType');
    setSelectedPayment(null);
    toast({
      title: "Payment Successful",
      description: `You have purchased 1 ${selectedNewsletterType === 'premium' ? 'Premium' : 'Standard'} Newsletter Credit!`,
    });
    // Refresh user document
    if (currentUser) {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      setUserDoc(userSnap.exists() ? userSnap.data() as UserDoc : null);
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
        <Dialog open={paymentModal} onOpenChange={(open) => {
          if (!open) {
            setPaymentModal(false);
            setSelectedNewsletterType(null);
            setPaymentStep('selectType');
            setSelectedPayment(null);
            setPaymentError(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => {
              setPaymentModal(true);
              setSelectedNewsletterType(null);
              setPaymentStep('selectType');
              setSelectedPayment(null);
              setPaymentError(null);
            }}>
              Buy More Credit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Buy Newsletter Credit</DialogTitle>
              <DialogDescription>
                {paymentStep === 'selectType' && 'Choose which type of newsletter credit you want to buy.'}
                {paymentStep === 'selectPayment' && 'Choose a payment method to continue.'}
                {paymentStep === 'pay' && selectedPayment === 'stripe' && 'Pay securely with your card.'}
                {paymentStep === 'pay' && selectedPayment === 'paypal' && 'Pay securely with PayPal.'}
              </DialogDescription>
            </DialogHeader>
            {/* Step 1: Choose credit type */}
            {paymentStep === 'selectType' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="newsletter-standard"
                    name="newsletter-type"
                    value="standard"
                    checked={selectedNewsletterType === 'standard'}
                    onChange={() => setSelectedNewsletterType('standard')}
                  />
                  <Label htmlFor="newsletter-standard" className="flex-1">
                    <div className="font-medium">Standard Newsletter Credit</div>
                    <div className="text-sm text-muted-foreground">
                      €400 per mention per month
                    </div>
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="newsletter-premium"
                    name="newsletter-type"
                    value="premium"
                    checked={selectedNewsletterType === 'premium'}
                    onChange={() => setSelectedNewsletterType('premium')}
                  />
                  <Label htmlFor="newsletter-premium" className="flex-1">
                    <div className="font-medium">Premium Newsletter Credit</div>
                    <div className="text-sm text-muted-foreground">
                      €600 per mention per month
                    </div>
                  </Label>
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={() => {
                    if (!selectedNewsletterType) return;
                    setPaymentStep('selectPayment');
                  }}
                  disabled={!selectedNewsletterType}
                >
                  Continue
                </Button>
              </div>
            )}
            {/* Step 2: Choose payment method */}
            {paymentStep === 'selectPayment' && (
              <div className="flex flex-col gap-4 py-4">
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    id="pay-stripe"
                    name="payment-method"
                    value="stripe"
                    checked={selectedPayment === 'stripe'}
                    onChange={() => setSelectedPayment('stripe')}
                  />
                  <Label htmlFor="pay-stripe">Pay with Card (Stripe)</Label>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    id="pay-paypal"
                    name="payment-method"
                    value="paypal"
                    checked={selectedPayment === 'paypal'}
                    onChange={() => setSelectedPayment('paypal')}
                  />
                  <Label htmlFor="pay-paypal">Pay with PayPal</Label>
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={async () => {
                    if (!selectedPayment) {
                      setPaymentError('Please select a payment method.');
                      return;
                    }
                    await handlePayment();
                  }}
                  disabled={processing}
                >
                  Continue
                </Button>
                {paymentError && <div className="text-red-500 text-sm mt-2">{paymentError}</div>}
              </div>
            )}
            {/* Step 3: Payment form */}
            {paymentStep === 'pay' && (
              <div className="flex flex-col gap-4 py-4">
                {selectedPayment === 'stripe' ? (
                  <div className="text-center">
                    <p className="text-lg font-semibold">€{selectedNewsletterType ? NEWSLETTER_PRICES[selectedNewsletterType] : 0}</p>
                    <p className="text-sm text-muted-foreground">{selectedNewsletterType === 'premium' ? 'Premium Newsletter Credit' : 'Standard Newsletter Credit'}</p>
                    <p className="text-sm text-muted-foreground mt-2">Redirecting to Stripe Checkout...</p>
                  </div>
                ) : selectedPayment === 'paypal' ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-lg font-semibold">€{selectedNewsletterType ? NEWSLETTER_PRICES[selectedNewsletterType] : 0}</p>
                      <p className="text-sm text-muted-foreground">{selectedNewsletterType === 'premium' ? 'Premium Newsletter Credit' : 'Standard Newsletter Credit'}</p>
                    </div>
                    <PayPalButtons
                      createOrder={createPayPalOrder}
                      onApprove={onPayPalApprove}
                      onError={onPayPalError}
                      style={{ layout: "vertical" }}
                    />
                  </div>
                ) : null}
                {paymentError && <div className="text-red-500 text-sm mt-2">{paymentError}</div>}
                <Button
                  variant="outline"
                  onClick={() => setPaymentStep('selectPayment')}
                  className="w-full"
                >
                  Back
                </Button>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentModal(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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