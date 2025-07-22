"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  return (
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
              {subscribers.map(email => (
                <li key={email} className="border-b last:border-b-0 py-2 text-foreground">{email}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
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
            onChange={e => setNewsletterHtml(e.target.value)}
          />
          <div className="flex gap-4 mb-4">
            <Button type="button" onClick={() => setPreview(p => !p)} variant="secondary">
              {preview ? "Hide Preview" : "Preview"}
            </Button>
            <Button type="button" disabled={!newsletterHtml.trim()}>
              Send Newsletter
            </Button>
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
  );
} 