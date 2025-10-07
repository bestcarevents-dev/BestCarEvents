"use client";

import { useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { app } from "@/lib/firebase";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check } from "lucide-react";

type UploadedImage = {
  url: string;
  name: string;
  size: number;
  storagePath: string;
};

export default function AdminNewsletterPage() {
  const storage = useMemo(() => getStorage(app), []);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [uploaded, setUploaded] = useState<UploadedImage[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const onSelectFiles = () => fileInputRef.current?.click();

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setProgressText("");
    try {
      const total = files.length;
      let done = 0;
      const newItems: UploadedImage[] = [];
      for (const file of Array.from(files)) {
        setProgressText(`Uploading ${done + 1} of ${total}...`);
        const storagePath = `newsletter_uploads/${Date.now()}_${file.name}`;
        const ref = storageRef(storage, storagePath);
        await uploadBytes(ref, file);
        const url = await getDownloadURL(ref);
        newItems.push({ url, name: file.name, size: file.size, storagePath });
        done += 1;
      }
      setUploaded((prev) => [...newItems, ...prev]);
      toast({ title: "Upload complete", description: `${newItems.length} image(s) uploaded.` });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "Could not upload images.", variant: "destructive" });
    } finally {
      setUploading(false);
      setProgressText("")
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast({ title: "Link copied", description: "Paste this URL into your newsletter." });
      setTimeout(() => setCopiedUrl((prev) => (prev === url ? null : prev)), 1500);
    } catch {}
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Newsletter Image Uploader</CardTitle>
          <CardDescription>Upload image → get link. Use the link in your newsletter.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload images to storage and get public links. Share those links with your newsletter generator.
            </p>

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
              <Button type="button" onClick={onSelectFiles} disabled={uploading}>
                {uploading ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Uploading...</span>
                ) : (
                  "Select images"
                )}
              </Button>
              {progressText && <span className="text-sm text-muted-foreground">{progressText}</span>}
            </div>

            {uploaded.length > 0 && (
              <div className="mt-2 space-y-4">
                <div className="text-sm font-medium">Uploaded images</div>
                <div className="space-y-4">
                  {uploaded.map((img) => (
                    <div key={img.url} className="flex items-start gap-4 border rounded-lg p-3 bg-muted/30">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-24 h-24 object-cover rounded"
                      />
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="text-sm truncate" title={img.name}>{img.name}</div>
                        <div className="flex items-center gap-2">
                          <Input readOnly value={img.url} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                          <Button type="button" variant="secondary" onClick={() => copyUrl(img.url)} className="shrink-0">
                            {copiedUrl === img.url ? (
                              <span className="inline-flex items-center gap-1"><Check className="w-4 h-4" />Copied</span>
                            ) : (
                              <span className="inline-flex items-center gap-1"><Copy className="w-4 h-4" />Copy</span>
                            )}
                          </Button>
                          <a href={img.url} target="_blank" rel="noreferrer" className="text-sm underline">Open</a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}