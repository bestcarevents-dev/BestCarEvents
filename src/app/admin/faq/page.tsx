"use client";

import { useEffect, useMemo, useState } from "react";
import { app } from "@/lib/firebase";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch, orderBy, query } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { FaqItem, FaqSettings } from "@/lib/faq";
import { defaultFaqs, defaultFaqSettings } from "@/lib/faq";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function AdminFaqPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<FaqItem[]>([]);
  const [settings, setSettings] = useState<FaqSettings>(defaultFaqSettings);
  const db = useMemo(() => getFirestore(app), []);

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (u) => setIsAuthed(!!u));
    return () => unsub();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Load FAQs
        const qy = query(collection(db, "faqs"));
        const snap = await getDocs(qy);
        const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FaqItem[];
        const sorted = (data.length ? data : defaultFaqs).map((it, i) => ({ ...it, order: it.order ?? i })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setItems(sorted);

        // Load settings
        try {
          const settingsDoc = await getDocs(collection(db, "site_content"));
          const faqSettingsDoc = settingsDoc.docs.find((d) => d.id === "faq_settings");
          if (faqSettingsDoc) {
            const raw = (faqSettingsDoc.data() as any) || {};
            setSettings({ ...defaultFaqSettings, ...raw });
          } else {
            setSettings(defaultFaqSettings);
          }
        } catch {
          setSettings(defaultFaqSettings);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [db]);

  const addNew = () => {
    setItems((prev) => [
      ...prev,
      { id: undefined, question: "", answer: "", tags: [], order: prev.length },
    ]);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const batch = writeBatch(db);
      // Persist FAQ items
      const normalized = items
        .map((it, idx) => ({ ...it, order: idx }))
        .filter((it) => (it.question || "").trim().length > 0 && (it.answer || "").trim().length > 0);

      for (const it of normalized) {
        if (it.id) {
          batch.update(doc(db, "faqs", it.id), {
            question: it.question,
            answer: it.answer,
            tags: it.tags || [],
            order: it.order ?? 0,
            updatedAt: Date.now(),
          });
        } else {
          const ref = doc(collection(db, "faqs"));
          batch.set(ref, {
            question: it.question,
            answer: it.answer,
            tags: it.tags || [],
            order: it.order ?? 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }

      // Delete removed items: fetch current IDs and remove those not in normalized
      const snap = await getDocs(collection(db, "faqs"));
      const existingIds = new Set(snap.docs.map((d) => d.id));
      const keepIds = new Set(normalized.filter((it) => it.id).map((it) => it.id as string));
      for (const id of existingIds) {
        if (!keepIds.has(id)) {
          batch.delete(doc(db, "faqs", id));
        }
      }

      // Save settings
      batch.set(doc(db, "site_content", "faq_settings"), settings, { merge: true });

      await batch.commit();
    } finally {
      setSaving(false);
    }
  };

  const move = (index: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  };

  const remove = async (index: number) => {
    const it = items[index];
    const confirmed = typeof window !== 'undefined' ? window.confirm('Delete this question?') : true;
    if (!confirmed) return;
    try {
      if (it.id) {
        await deleteDoc(doc(db, "faqs", it.id));
      }
    } finally {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  if (!isAuthed) return <div className="text-sm text-muted-foreground">Please sign in…</div>;
  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="items">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="items">Questions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={addNew}>Add Question</Button>
            <Button onClick={saveAll} disabled={saving}>{saving ? "Saving…" : "Save All"}</Button>
          </div>
        </div>

        <TabsContent value="items">
          <div className="space-y-4">
            {items.map((it, idx) => (
              <Card key={it.id ?? `new-${idx}`}> 
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>FAQ #{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => move(idx, -1)} disabled={idx === 0}>Up</Button>
                      <Button variant="outline" size="sm" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>Down</Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => remove(idx)}>Delete</Button>
                    </div>
                  </CardTitle>
                  <CardDescription>Question and answer block</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Question</Label>
                    <Input
                      value={it.question}
                      onChange={(e) => setItems((prev) => prev.map((p, i) => i === idx ? { ...p, question: e.target.value } : p))}
                      placeholder="Enter question"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Answer</Label>
                    <Textarea
                      value={it.answer}
                      onChange={(e) => setItems((prev) => prev.map((p, i) => i === idx ? { ...p, answer: e.target.value } : p))}
                      rows={5}
                      placeholder="Enter answer"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Tags (comma separated, optional)</Label>
                    <Input
                      value={(it.tags || []).join(", ")}
                      onChange={(e) => setItems((prev) => prev.map((p, i) => i === idx ? { ...p, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } : p))}
                      placeholder="e.g. Free, Premium, Multi-language"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
            {items.length === 0 && (
              <div className="text-sm text-muted-foreground">No questions yet. Click "Add Question" to create your first item.</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>FAQ Page Settings</CardTitle>
              <CardDescription>Control the public FAQ header text.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input value={settings.title || ""} onChange={(e) => setSettings((s) => ({ ...s, title: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Intro</Label>
                <Textarea rows={3} value={settings.intro || ""} onChange={(e) => setSettings((s) => ({ ...s, intro: e.target.value }))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


