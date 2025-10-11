"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { fetchImpressum, saveImpressum } from "@/lib/impressum";
import type { ImpressumDoc, ImpressumSection } from "@/types/impressum";

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function AdminImpressumPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<ImpressumDoc>({ title: "", subtitle: "", sections: [], updatedAt: Date.now() });

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, (user) => setIsAuthed(!!user));
    return () => unsub();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchImpressum();
        setState(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addSection = () => {
    const newSection: ImpressumSection = { id: generateId(), title: "New Section", content: "" };
    setState((prev) => ({ ...prev, sections: [...prev.sections, newSection] }));
  };

  const removeSection = (id: string) => {
    setState((prev) => ({ ...prev, sections: prev.sections.filter((s) => s.id !== id) }));
  };

  const moveSection = (id: string, direction: "up" | "down") => {
    setState((prev) => {
      const idx = prev.sections.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const nextIdx = direction === "up" ? idx - 1 : idx + 1;
      if (nextIdx < 0 || nextIdx >= prev.sections.length) return prev;
      const copy = [...prev.sections];
      const [item] = copy.splice(idx, 1);
      copy.splice(nextIdx, 0, item);
      return { ...prev, sections: copy };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveImpressum(state);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8 text-sm text-muted-foreground">Loading Impressum...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Impressum / Legal Notice</CardTitle>
            <CardDescription>Edit the Impressum sections shown publicly.</CardDescription>
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input value={state.title} onChange={(e) => setState((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input value={state.subtitle || ""} onChange={(e) => setState((p) => ({ ...p, subtitle: e.target.value }))} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Sections</h3>
            <Button type="button" variant="secondary" onClick={addSection}>Add Section</Button>
          </div>

          <div className="space-y-4">
            {state.sections.map((section, index) => (
              <div key={section.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Section {index + 1}</div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => moveSection(section.id, "up")}>Up</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => moveSection(section.id, "down")}>Down</Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeSection(section.id)}>Delete</Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Section Title</Label>
                    <Input
                      value={section.title}
                      onChange={(e) => setState((prev) => ({
                        ...prev,
                        sections: prev.sections.map((s) => s.id === section.id ? { ...s, title: e.target.value } : s),
                      }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Section Content</Label>
                  <Textarea
                    className="min-h-40"
                    value={section.content}
                    onChange={(e) => setState((prev) => ({
                      ...prev,
                      sections: prev.sections.map((s) => s.id === section.id ? { ...s, content: e.target.value } : s),
                    }))}
                  />
                  <p className="text-sm text-muted-foreground mt-2">Use blank lines to separate paragraphs.</p>
                </div>
              </div>
            ))}
            {state.sections.length === 0 && (
              <div className="text-sm text-muted-foreground">No sections yet. Click "Add Section" to create one.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


