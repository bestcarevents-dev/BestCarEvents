"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFirestore, doc, getDoc, collection, getDocs, query, where, updateDoc, increment } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";

interface NewsletterRequestDoc {
  id: string;
  type: "standard" | "premium";
  title: string;
  description: string;
  websiteUrl?: string;
  images: string[];
  status: "pending" | "approved" | "rejected";
  createdAt?: any;
  uploadedByUser?: string;
  uploadedByUserEmail?: string;
}

interface UserCreditsDoc {
  id: string;
  email: string;
  standardNewsletterRemaining?: number;
  premiumNewsletterRemaining?: number;
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Requests + modal
  const [approvedRequests, setApprovedRequests] = useState<NewsletterRequestDoc[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<NewsletterRequestDoc | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserCreditsDoc | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);

  // Builder (simplified to image upload -> link list)
  const [activeTab, setActiveTab] = useState<string>("builder");
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const { toast } = useToast();

  // Raw HTML sender (legacy)
  const [newsletterHtml, setNewsletterHtml] = useState("");
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const fetchSubscribers = async () => {
      setLoading(true);
      setError(null);
      try {
        const db = getFirestore(app);
        const docRef = doc(db, "newsletter", "subscribers");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSubscribers(Object.keys(data));
        } else {
          setSubscribers([]);
        }
      } catch (err) {
        setError("Failed to fetch subscribers.");
      } finally {
        setLoading(false);
      }
    };
    fetchSubscribers();
  }, []);

  // Load newsletter requests (all are auto-approved now)
  useEffect(() => {
    const fetchApproved = async () => {
      setRequestsLoading(true);
      try {
        const db = getFirestore(app);
        const snap = await getDocs(collection(db, "newsletterrequests"));
        setApprovedRequests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as NewsletterRequestDoc[]);
      } finally {
        setRequestsLoading(false);
      }
    };
    fetchApproved();
  }, []);

  const openRequestModal = async (req: NewsletterRequestDoc) => {
    setSelectedRequest(req);
    setSelectedUser(null);
    if (!req.uploadedByUserEmail) return;
    setCreditsLoading(true);
    try {
      const db = getFirestore(app);
      const q = query(collection(db, "users"), where("email", "==", req.uploadedByUserEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data() as any;
        setSelectedUser({
          id: d.id,
          email: data.email,
          standardNewsletterRemaining: data.standardNewsletterRemaining || 0,
          premiumNewsletterRemaining: data.premiumNewsletterRemaining || 0,
        });
      }
    } finally {
      setCreditsLoading(false);
    }
  };

  const adjustCredits = async (
    userId: string,
    field: "standardNewsletterRemaining" | "premiumNewsletterRemaining",
    delta: number
  ) => {
    const db = getFirestore(app);
    await updateDoc(doc(db, "users", userId), { [field]: increment(delta) });
    setSelectedUser((prev) =>
      prev ? { ...prev, [field]: (prev[field] || 0) + delta } as UserCreditsDoc : prev
    );
  };

  const onUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const storage = getStorage(app);
      const urls: string[] = [];
      let uploadedCount = 0;
      for (const file of Array.from(files)) {
        const path = `newsletter_builder_uploads/${Date.now()}_${file.name}`;
        const ref = storageRef(storage, path);
        await uploadBytes(ref, file);
        const url = await getDownloadURL(ref);
        urls.push(normalizeStorageUrl(url));
        uploadedCount += 1;
        if (uploadedCount < files.length) {
          toast({ title: "Uploading...", description: `Uploaded ${uploadedCount} of ${files.length}` });
        }
      }
      setUploadedImages((prev) => [...urls, ...prev]);
      toast({ title: "Upload complete", description: `${urls.length} image${urls.length > 1 ? "s" : ""} uploaded.` });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "Could not upload images.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="builder">Newsletter Builder</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="approved">Approved Requests</TabsTrigger>
          <TabsTrigger value="raw">Raw HTML</TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Newsletter Builder</CardTitle>
                <CardDescription>Upload image, get public link. Use the link in your newsletter.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Input type="file" accept="image/*" multiple onChange={(e) => onUploadImages(e.target.files)} />
                    <Button type="button" variant="secondary" disabled={uploading} onClick={() => {
                      const input = document.getElementById("newsletter-image-input") as HTMLInputElement | null;
                      input?.click();
                    }} style={{ display: "none" }}>
                      Choose Files
                    </Button>
                    {uploading && (
                      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</span>
                    )}
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Uploaded Images</div>
                        <Button size="sm" variant="outline" onClick={() => setUploadedImages([])}>Clear List</Button>
                      </div>
                      <div className="space-y-3">
                        {uploadedImages.map((url, idx) => (
                          <div key={idx} className="flex items-start gap-3 border rounded p-2">
                            <img src={normalizeStorageUrl(url)} alt="uploaded" className="w-20 h-20 object-cover rounded" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-muted-foreground mb-1">Public Link</div>
                              <div className="flex items-center gap-2">
                                <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="truncate" />
                                <Button size="sm" variant="secondary" onClick={async () => { await navigator.clipboard.writeText(url); toast({ title: "Link copied" }); }}>Copy</Button>
                                <a href={url} target="_blank" rel="noreferrer">
                                  <Button size="sm" variant="outline">Open</Button>
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {uploadedImages.length === 0 && !uploading && (
                    <div className="text-sm text-muted-foreground">Select one or more images to upload. You will get public links to use elsewhere.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscribers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Newsletter Subscribers</CardTitle>
                <CardDescription>All emails subscribed to the newsletter.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-muted-foreground">Loading subscribers...</div>
                ) : error ? (
                  <div className="text-red">{error}</div>
                ) : subscribers.length === 0 ? (
                  <div className="text-muted-foreground">No subscribers found.</div>
                ) : (
                  <ul className="max-h-96 overflow-auto space-y-2 text-sm">
                    {subscribers.map((email) => (
                      <li key={email} className="border-b last:border-b-0 py-2 text-foreground">{email}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="approved">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Approved Newsletter Requests</CardTitle>
              <CardDescription>View approved requests and manage user credits.</CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="text-muted-foreground">Loading approved requests...</div>
              ) : approvedRequests.length === 0 ? (
                <div className="text-muted-foreground">No approved requests.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Uploaded By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedRequests.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <Badge variant={r.type === "premium" ? "default" : "secondary"}>
                              {r.type === "premium" ? "Premium" : "Standard"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[260px] truncate">{r.title}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{r.uploadedByUser || "Unknown"}</div>
                              <div className="text-muted-foreground">{r.uploadedByUserEmail || "-"}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{r.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {r.createdAt?.seconds
                              ? new Date(r.createdAt.seconds * 1000).toLocaleDateString('en-GB')
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => openRequestModal(r)}>View</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={!!selectedRequest} onOpenChange={(o) => !o && setSelectedRequest(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Request Details</DialogTitle>
                <DialogDescription>View request information and manage uploader credits.</DialogDescription>
              </DialogHeader>
              {selectedRequest && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Type</div>
                      <div className="font-medium capitalize">{selectedRequest.type}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Title</div>
                      <div className="font-medium">{selectedRequest.title}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Description</div>
                      <div className="text-sm whitespace-pre-wrap">{selectedRequest.description}</div>
                    </div>
                    {selectedRequest.websiteUrl && (
                      <div>
                        <div className="text-xs text-muted-foreground">Website</div>
                        <a className="text-primary hover:underline break-all" href={selectedRequest.websiteUrl} target="_blank" rel="noreferrer">
                          {selectedRequest.websiteUrl}
                        </a>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-muted-foreground">Uploaded By</div>
                      <div className="text-sm">
                        <div className="font-medium">{selectedRequest.uploadedByUser || "Unknown"}</div>
                        <div className="text-muted-foreground">{selectedRequest.uploadedByUserEmail || "-"}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Created</div>
                      <div className="text-sm">
                        {selectedRequest.createdAt?.seconds
                          ? new Date(selectedRequest.createdAt.seconds * 1000).toLocaleString('en-GB')
                          : "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Images</div>
                      {selectedRequest.images?.length ? (
                        <>
                          <div className="text-xs text-muted-foreground mb-2">Tip: Click an image to copy its URL. Then paste it into the Image block in the builder.</div>
                          <div className="grid grid-cols-2 gap-3">
                            {selectedRequest.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={normalizeStorageUrl(img)}
                                alt="newsletter"
                                title="Click to copy URL"
                                className="w-full h-28 object-cover rounded cursor-pointer hover:opacity-80"
                                onClick={async () => {
                                  await navigator.clipboard.writeText(normalizeStorageUrl(img));
                                  toast({ title: "Image URL copied", description: "Paste it into the builder's Image block." });
                                }}
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">No images</div>
                      )}
                    </div>

                    <div className="border rounded p-3">
                      <div className="font-medium mb-2">Uploader Credits</div>
                      {creditsLoading ? (
                        <div className="text-sm text-muted-foreground">Loading credits...</div>
                      ) : selectedUser ? (
                        <div className="space-y-3">
                          <div className="text-xs text-muted-foreground">User: {selectedUser.email}</div>
                          <div className="flex items-center justify-between bg-muted rounded p-2">
                            <div>
                              <div className="text-sm">Standard Newsletter</div>
                              <div className="text-xs text-muted-foreground">Remaining: {selectedUser.standardNewsletterRemaining || 0}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => adjustCredits(selectedUser.id, "standardNewsletterRemaining", -1)}>-1</Button>
                              <Button size="sm" variant="outline" onClick={() => adjustCredits(selectedUser.id, "standardNewsletterRemaining", +1)}>+1</Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between bg-muted rounded p-2">
                            <div>
                              <div className="text-sm">Premium Newsletter</div>
                              <div className="text-xs text-muted-foreground">Remaining: {selectedUser.premiumNewsletterRemaining || 0}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => adjustCredits(selectedUser.id, "premiumNewsletterRemaining", -1)}>-1</Button>
                              <Button size="sm" variant="outline" onClick={() => adjustCredits(selectedUser.id, "premiumNewsletterRemaining", +1)}>+1</Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No user record found for this email.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="raw">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Send Newsletter</CardTitle>
                <CardDescription>Write your newsletter in HTML and preview it before sending.</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full min-h-[200px] max-h-[400px] rounded-lg border border-input bg-background p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                  placeholder="Paste or write your HTML newsletter here..."
                  value={newsletterHtml}
                  onChange={(e) => setNewsletterHtml(e.target.value)}
                />
                <div className="flex gap-4 mb-4">
                  <Button type="button" onClick={() => setPreview((p) => !p)} variant="secondary">
                    {preview ? "Hide Preview" : "Preview"}
                  </Button>
                  <Button
                    type="button"
                    disabled={!newsletterHtml.trim()}
                    onClick={async () => {
                      try {
                        const subject = 'BestCarEvents Newsletter';
                        const res = await fetch('/api/emails/newsletter-send', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ subject, html: newsletterHtml, mode: 'all' })
                        });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json?.error || 'Failed to send');
                        toast({ title: 'Newsletter queued', description: `Sent to ${json.sent} subscribers.` });
                      } catch (e: any) {
                        toast({ title: 'Send failed', description: e?.message || 'Unknown error', variant: 'destructive' });
                      }
                    }}
                  >Send Newsletter</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={async () => {
                      const email = prompt('Enter test email:');
                      if (!email) return;
                      try {
                        const subject = 'BestCarEvents Newsletter (Test)';
                        const res = await fetch('/api/emails/newsletter-send', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ subject, html: newsletterHtml, mode: 'test', testEmail: email })
                        });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json?.error || 'Failed to send');
                        toast({ title: 'Test email sent', description: `Sent to ${email}.` });
                      } catch (e: any) {
                        toast({ title: 'Test send failed', description: e?.message || 'Unknown error', variant: 'destructive' });
                      }
                    }}
                  >Send Test</Button>
                </div>
                {preview && (
                  <div className="border rounded-lg p-4 bg-muted/50 mt-2">
                    <div className="font-semibold mb-2 text-muted-foreground">Preview:</div>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: newsletterHtml }} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeStorageUrl(input: string) {
  // Fix double-encoded slashes in Firebase Storage URLs
  return input.replace(/%252F/g, "%2F");
} 