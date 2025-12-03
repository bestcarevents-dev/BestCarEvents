"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { fetchAllFreeCallouts, saveFreeCallout, defaultFreeCallouts, type FreeCalloutSection, type FreeCalloutContent } from "@/lib/freeCallout";
import { fetchFreeListingsModal, saveFreeListingsModal, defaultFreeListingsModal, type FreeListingsModalContent } from "@/lib/freeListingsModal";

const sections: FreeCalloutSection[] = ["events", "auctions", "others", "clubs", "hotels"];

export default function AdminFreeListingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("callouts");
  const [callouts, setCallouts] = useState<Record<FreeCalloutSection, FreeCalloutContent>>(defaultFreeCallouts);
  const [modalCopy, setModalCopy] = useState<FreeListingsModalContent>(defaultFreeListingsModal);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAllFreeCallouts();
        setCallouts(data);
      } catch {}
      try {
        const modal = await fetchFreeListingsModal();
        setModalCopy(modal);
      } catch {}
    })();
  }, []);

  const handleCalloutChange = (section: FreeCalloutSection, field: keyof FreeCalloutContent, value: any) => {
    setCallouts(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleMessageChange = (section: FreeCalloutSection, index: number, value: string) => {
    const current = callouts[section];
    const next = [...(current.messages || [])];
    next[index] = value;
    handleCalloutChange(section, "messages", next);
  };

  const addMessage = (section: FreeCalloutSection) => {
    handleCalloutChange(section, "messages", [ ...(callouts[section].messages || []), "" ]);
  };

  const removeMessage = (section: FreeCalloutSection, index: number) => {
    const next = [...(callouts[section].messages || [])];
    next.splice(index, 1);
    handleCalloutChange(section, "messages", next);
  };

  const saveAllCallouts = async () => {
    setSaving(true);
    try {
      for (const s of sections) {
        await saveFreeCallout(s, callouts[s]);
      }
      toast({ title: "Saved", description: "Free callouts updated." });
    } catch (e: any) {
      const message = e?.message || (typeof e === 'string' ? e : 'Failed to save callouts.');
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveModal = async () => {
    setSaving(true);
    try {
      await saveFreeListingsModal(modalCopy);
      toast({ title: "Saved", description: "Modal copy updated." });
    } catch (e: any) {
      const message = e?.message || (typeof e === 'string' ? e : 'Failed to save modal copy.');
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Free Listings Content</h1>
        <p className="text-muted-foreground">Edit the FreeCallout sections and the Free Listings modal.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="callouts">Callouts</TabsTrigger>
          <TabsTrigger value="modal">Modal</TabsTrigger>
        </TabsList>

        <TabsContent value="callouts">
          <div className="grid gap-6 md:grid-cols-2">
            {sections.map((section) => (
              <Card key={section}>
                <CardHeader>
                  <CardTitle className="capitalize">{section}</CardTitle>
                  <CardDescription>Manage callout content for {section} page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={callouts[section]?.title || ""}
                      onChange={(e) => handleCalloutChange(section, "title", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Select value={callouts[section]?.icon || "megaphone"} onValueChange={(v) => handleCalloutChange(section, "icon", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select icon" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="megaphone">Megaphone</SelectItem>
                        <SelectItem value="sparkles">Sparkles</SelectItem>
                        <SelectItem value="gift">Gift</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Messages</Label>
                    {(callouts[section]?.messages || []).map((msg, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input value={msg} onChange={(e) => handleMessageChange(section, idx, e.target.value)} />
                        <Button variant="outline" onClick={() => removeMessage(section, idx)}>Remove</Button>
                      </div>
                    ))}
                    <Button variant="secondary" onClick={() => addMessage(section)}>Add Message</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Promo Label</Label>
                      <Input
                        value={callouts[section]?.promoLabel ?? ""}
                        onChange={(e) => handleCalloutChange(section, "promoLabel", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Promo Text</Label>
                      <Input
                        value={callouts[section]?.promoText ?? ""}
                        onChange={(e) => handleCalloutChange(section, "promoText", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Promo Highlight</Label>
                      <Input
                        value={callouts[section]?.promoHighlight ?? ""}
                        onChange={(e) => handleCalloutChange(section, "promoHighlight", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>CTA Href</Label>
                      <Input
                        value={(callouts[section]?.ctaHref ?? defaultFreeCallouts[section]?.ctaHref) || ""}
                        onChange={(e) => handleCalloutChange(section, "ctaHref", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA Text</Label>
                      <Input
                        value={(callouts[section]?.ctaText ?? defaultFreeCallouts[section]?.ctaText) || ""}
                        onChange={(e) => handleCalloutChange(section, "ctaText", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={saveAllCallouts} disabled={saving}>
              {saving ? "Saving..." : "Save Callouts"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="modal">
          <Card>
            <CardHeader>
              <CardTitle>Free Listings Modal</CardTitle>
              <CardDescription>Edit the modal copy. Affects targeted pages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Headline Top</Label>
                  <Input value={modalCopy.headlineTop} onChange={(e) => setModalCopy({ ...modalCopy, headlineTop: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Headline Emphasis</Label>
                  <Input value={modalCopy.headlineEmphasis} onChange={(e) => setModalCopy({ ...modalCopy, headlineEmphasis: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subline</Label>
                <Input value={modalCopy.subline || ""} onChange={(e) => setModalCopy({ ...modalCopy, subline: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>CTA Label</Label>
                <Input value={modalCopy.ctaLabel} onChange={(e) => setModalCopy({ ...modalCopy, ctaLabel: e.target.value })} />
              </div>
              <div className="flex justify-end">
                <Button onClick={saveModal} disabled={saving}>{saving ? "Saving..." : "Save Modal"}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


