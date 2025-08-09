"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFirestore, doc, getDoc, collection, getDocs, query, where, updateDoc, increment } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Loader2 } from "lucide-react";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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

// Simple block-based builder types
type BuilderBlock =
  | { id: string; type: "heading"; content: string }
  | { id: string; type: "text"; content: string }
  | { id: string; type: "image"; url: string; alt?: string }
  | { id: string; type: "button"; label: string; href: string }
  | { id: string; type: "divider" };

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

  // HTML builder
  const [activeTab, setActiveTab] = useState<string>("builder");
  const [builderBlocks, setBuilderBlocks] = useState<BuilderBlock[]>([]);
  const [iframePreviewKey, setIframePreviewKey] = useState<number>(0);
  const [blockUploading, setBlockUploading] = useState<Record<string, boolean>>({});

  // Visual design settings for non-technical users
  const [design, setDesign] = useState({
    fontFamily: "Arial, sans-serif",
    textColor: "#111111",
    backgroundColor: "#f6f7f9",
    containerBgColor: "#ffffff",
    accentColor: "#111111",
    containerWidth: 600,
    borderRadius: 8,
  });

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

  // Load approved newsletter requests
  useEffect(() => {
    const fetchApproved = async () => {
      setRequestsLoading(true);
      try {
        const db = getFirestore(app);
        const q = query(collection(db, "newsletterrequests"), where("status", "==", "approved"));
        const snap = await getDocs(q);
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

  // Builder helpers
  const addBlock = (type: BuilderBlock["type"]) => {
    const id = Math.random().toString(36).slice(2);
    if (type === "heading") setBuilderBlocks((b) => [...b, { id, type, content: "Your headline" }]);
    if (type === "text") setBuilderBlocks((b) => [...b, { id, type, content: "Write something engaging..." }]);
    if (type === "image") setBuilderBlocks((b) => [...b, { id, type, url: "https://via.placeholder.com/600x300", alt: "" }]);
    if (type === "button") setBuilderBlocks((b) => [...b, { id, type, label: "Learn more", href: "https://example.com" }]);
    if (type === "divider") setBuilderBlocks((b) => [...b, { id, type }]);
  };

  const removeBlock = (id: string) => setBuilderBlocks((b) => b.filter((x) => x.id !== id));

  const moveBlock = (id: string, direction: "up" | "down") => {
    setBuilderBlocks((b) => {
      const idx = b.findIndex((x) => x.id === id);
      if (idx < 0) return b;
      const next = [...b];
      const swapWith = direction === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= b.length) return b;
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  };

  const renderBlockEditor = (block: BuilderBlock) => {
    switch (block.type) {
      case "heading":
        return (
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input
              value={block.content}
              onChange={(e) =>
                setBuilderBlocks((b) => b.map((x) => (x.id === block.id ? { ...block, content: e.target.value } : x)))
              }
            />
          </div>
        );
      case "text":
        return (
          <div className="space-y-2">
            <Label>Text</Label>
            <Textarea
              value={block.content}
              onChange={(e) =>
                setBuilderBlocks((b) => b.map((x) => (x.id === block.id ? { ...block, content: e.target.value } : x)))
              }
              rows={4}
            />
          </div>
        );
      case "image":
        return (
          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input
              value={block.url}
              onChange={(e) =>
                setBuilderBlocks((b) => b.map((x) => (x.id === block.id ? { ...block, url: e.target.value } : x)))
              }
              placeholder="https://..."
            />
            <div className="flex items-center gap-2">
              <input
                id={`file-${block.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setBlockUploading((s) => ({ ...s, [block.id]: true }));
                    const storage = getStorage(app);
                    const objRef = storageRef(storage, `newsletter_builder_images/${Date.now()}_${file.name}`);
                    await uploadBytes(objRef, file);
                    const url = await getDownloadURL(objRef);
                    setBuilderBlocks((b) => b.map((x) => (x.id === block.id ? { ...block, url } : x)));
                    toast({ title: "Image uploaded", description: "The image URL has been set for this block." });
                  } catch (err) {
                    toast({ title: "Upload failed", description: "Could not upload image. Try again.", variant: "destructive" });
                  } finally {
                    setBlockUploading((s) => ({ ...s, [block.id]: false }));
                  }
                }}
              />
              <Button type="button" variant="secondary" size="sm" onClick={() => document.getElementById(`file-${block.id}`)?.click()} disabled={!!blockUploading[block.id]}>
                {blockUploading[block.id] ? (<span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Uploading...</span>) : "Upload Image"}
              </Button>
            </div>
          </div>
        );
      case "button":
        return (
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={block.label}
              onChange={(e) =>
                setBuilderBlocks((b) => b.map((x) => (x.id === block.id ? { ...block, label: e.target.value } : x)))
              }
            />
            <Label>URL</Label>
            <Input
              value={block.href}
              onChange={(e) =>
                setBuilderBlocks((b) => b.map((x) => (x.id === block.id ? { ...block, href: e.target.value } : x)))
              }
              placeholder="https://..."
            />
          </div>
        );
      case "divider":
        return <div className="text-sm text-muted-foreground">A horizontal divider will be inserted.</div>;
    }
  };

  const generatedHtml = useMemo(() => {
    // Extremely basic email-friendly template with inline styles
    const rows = builderBlocks
      .map((b) => {
        if (b.type === "heading") {
          return `<tr><td style="padding:16px 0;font-family:${design.fontFamily};font-size:24px;font-weight:bold;color:${design.textColor}">${escapeHtml(
            b.content
          )}</td></tr>`;
        }
        if (b.type === "text") {
          return `<tr><td style="padding:8px 0;font-family:${design.fontFamily};font-size:14px;line-height:1.6;color:${design.textColor}">${escapeHtml(
            b.content
          ).replace(/\n/g, "<br/>")}</td></tr>`;
        }
        if (b.type === "image") {
          return `<tr><td style="padding:12px 0"><img src="${encodeURI(b.url)}" alt="${escapeHtml(
            b.alt || ""
          )}" style="max-width:100%;height:auto;border:0;display:block"/></td></tr>`;
        }
        if (b.type === "button") {
          return `<tr><td style="padding:16px 0"><a href="${encodeURI(
            b.href
          )}" style="background:${design.accentColor};color:#fff;padding:12px 20px;border-radius:${design.borderRadius}px;text-decoration:none;font-family:${design.fontFamily};font-size:14px;display:inline-block">${escapeHtml(
            b.label
          )}</a></td></tr>`;
        }
        if (b.type === "divider") {
          return `<tr><td style="padding:16px 0"><hr style="border:none;border-top:1px solid #e5e7eb"/></td></tr>`;
        }
        return "";
      })
      .join("");

    return `<!doctype html>
<html>
<head>
  <meta charSet="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Newsletter</title>
</head>
<body style="margin:0;padding:0;background:${design.backgroundColor};">
  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background:${design.backgroundColor};padding:24px 0;">
    <tr>
      <td>
        <table role="presentation" width="${design.containerWidth}" align="center" cellPadding="0" cellSpacing="0" style="margin:0 auto;background:${design.containerBgColor};padding:24px;border-radius:${design.borderRadius}px;">
          ${rows}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }, [builderBlocks, design]);

  const refreshIframe = () => setIframePreviewKey((k) => k + 1);

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Newsletter</CardTitle>
                <CardDescription>Build a newsletter without HTML. Add blocks and preview.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 space-y-3">
                  <div className="font-semibold">Design Settings</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Font Family</Label>
                      <Select value={design.fontFamily} onValueChange={(v) => setDesign((d) => ({ ...d, fontFamily: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                          <SelectItem value="Georgia, serif">Georgia</SelectItem>
                          <SelectItem value="'Times New Roman', Times, serif">Times New Roman</SelectItem>
                          <SelectItem value="Verdana, Geneva, sans-serif">Verdana</SelectItem>
                          <SelectItem value="Tahoma, Geneva, sans-serif">Tahoma</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Text Color</Label>
                      <Input type="color" value={design.textColor} onChange={(e) => setDesign((d) => ({ ...d, textColor: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Background Color</Label>
                      <Input type="color" value={design.backgroundColor} onChange={(e) => setDesign((d) => ({ ...d, backgroundColor: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Container Color</Label>
                      <Input type="color" value={design.containerBgColor} onChange={(e) => setDesign((d) => ({ ...d, containerBgColor: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Accent Color (Buttons)</Label>
                      <Input type="color" value={design.accentColor} onChange={(e) => setDesign((d) => ({ ...d, accentColor: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>Container Width (px)</Label>
                      <Input type="number" min={320} max={800} value={design.containerWidth} onChange={(e) => setDesign((d) => ({ ...d, containerWidth: Number(e.target.value || 600) }))} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Button size="sm" variant="secondary" onClick={() => addBlock("heading")}>Add Heading</Button>
                  <Button size="sm" variant="secondary" onClick={() => addBlock("text")}>Add Text</Button>
                  <Button size="sm" variant="secondary" onClick={() => addBlock("image")}>Add Image</Button>
                  <Button size="sm" variant="secondary" onClick={() => addBlock("button")}>Add Button</Button>
                  <Button size="sm" variant="secondary" onClick={() => addBlock("divider")}>Add Divider</Button>
                </div>
                {builderBlocks.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No blocks yet. Use the buttons above to add content.</div>
                ) : (
                  <div className="space-y-4">
                    {builderBlocks.map((block) => (
                      <div key={block.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-medium capitalize">{block.type}</div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => moveBlock(block.id, "up")}>Up</Button>
                            <Button size="sm" variant="outline" onClick={() => moveBlock(block.id, "down")}>Down</Button>
                            <Button size="sm" variant="destructive" onClick={() => removeBlock(block.id)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {renderBlockEditor(block)}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <Button onClick={refreshIframe} variant="default">Update Preview</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedHtml);
                      toast({ title: "HTML copied", description: "You can now paste this into your sender." });
                    }}
                    disabled={!builderBlocks.length}
                  >
                    Copy HTML
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Live preview of your newsletter.</CardDescription>
              </CardHeader>
              <CardContent>
                <iframe
                  key={iframePreviewKey}
                  title="Newsletter Preview"
                  className="w-full h-[600px] border rounded"
                  srcDoc={generatedHtml}
                />
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
                  <div className="text-destructive">{error}</div>
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
                              ? new Date(r.createdAt.seconds * 1000).toLocaleDateString()
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
                          ? new Date(selectedRequest.createdAt.seconds * 1000).toLocaleString()
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
                                src={img}
                                alt="newsletter"
                                title="Click to copy URL"
                                className="w-full h-28 object-cover rounded cursor-pointer hover:opacity-80"
                                onClick={async () => {
                                  await navigator.clipboard.writeText(img);
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
                  <Button type="button" disabled={!newsletterHtml.trim()}>Send Newsletter</Button>
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