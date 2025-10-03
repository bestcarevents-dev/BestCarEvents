"use client";

import { useEffect, useMemo, useState } from "react";
import { app } from "@/lib/firebase";
import { getFirestore, collection, query, where, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { markNotificationAsRead } from "@/lib/notifications";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminAdEditNotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);
  const [diffOpen, setDiffOpen] = useState<null | { id: string; changes: Array<{ field: string; before: any; after: any }> }>(null);
  const db = useMemo(() => getFirestore(app), []);

  useEffect(() => {
    setLoading(true);
    const qRef = query(
      collection(db, "notifications"),
      where("type", "==", "partner_ad_edit")
    );
    const unsub = onSnapshot(qRef as any, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      // Sort client-side by createdAt desc when available
      list.sort((a: any, b: any) => {
        const aTs = a?.createdAt?.seconds ? a.createdAt.seconds : (a?.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
        const bTs = b?.createdAt?.seconds ? b.createdAt.seconds : (b?.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
        return bTs - aTs;
      });
      setItems(list);
      setLoading(false);
    }, (err) => {
      console.error("Failed to subscribe ad edit notifications", err);
      setLoading(false);
    });
    return () => {
      try { unsub(); } catch {}
    };
  }, [db]);

  const handleMarkRead = async (id: string) => {
    setMarking(id);
    try {
      await markNotificationAsRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: "read" } : n)));
    } catch (e) {
      // ignore
    } finally {
      setMarking(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-lg">Ad Edit Notifications</CardTitle>
          <CardDescription className="text-xs">Edits made by advertisers in /advertise/my-ads</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="overflow-x-auto max-h-[75vh]">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Ad ID</TableHead>
                  <TableHead className="whitespace-nowrap">User Email</TableHead>
                  <TableHead className="whitespace-nowrap">Updated Fields</TableHead>
                  <TableHead className="whitespace-nowrap">Images</TableHead>
                  <TableHead className="whitespace-nowrap">Created</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">Loading...</TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">No notifications.</TableCell>
                  </TableRow>
                ) : (
                  items.map((n) => {
                    const created = n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000) : (n.createdAt ? new Date(n.createdAt) : null);
                    return (
                      <TableRow key={n.id}>
                        <TableCell className="whitespace-nowrap">
                          {n.status === "unread" ? (
                            <Badge className="bg-blue-600">Unread</Badge>
                          ) : (
                            <Badge variant="secondary">Read</Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Link href={`/partners/ad/${n.relatedId}`} className="text-primary underline" target="_blank">{n.relatedId}</Link>
                        </TableCell>
                        <TableCell className="whitespace-nowrap max-w-[16rem] truncate">{n.userEmail || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap max-w-[22rem] truncate">{Array.isArray(n.data?.updatedFields) ? n.data.updatedFields.join(", ") : "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">{typeof n.data?.imageCount === "number" ? n.data.imageCount : "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">{created ? created.toLocaleString() : "-"}</TableCell>
                        <TableCell className="whitespace-nowrap flex gap-2">
                          {n.status !== "read" && (
                            <Button size="sm" variant="outline" disabled={marking === n.id} onClick={() => handleMarkRead(n.id)}>
                              {marking === n.id ? "Marking..." : "Mark as read"}
                            </Button>
                          )}
                          <Button asChild size="sm">
                            <Link href={`/admin/featured`}>
                              Edit Ad
                            </Link>
                          </Button>
                          {Array.isArray(n.data?.changes) && n.data.changes.length > 0 && (
                            <Button size="sm" variant="secondary" onClick={() => setDiffOpen({ id: n.id, changes: n.data.changes })}>
                              View Changes
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    {/* Diff Modal */}
    <Dialog open={!!diffOpen} onOpenChange={(o) => { if (!o) setDiffOpen(null); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ad Changes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Old</TableHead>
                <TableHead>New</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(diffOpen?.changes || []).map((c, idx) => (
                <TableRow key={idx}>
                  <TableCell className="align-top whitespace-nowrap font-medium">{c.field}</TableCell>
                  <TableCell className="align-top">
                    <pre className="whitespace-pre-wrap break-words text-xs bg-muted p-2 rounded border">{formatValue(c.before)}</pre>
                  </TableCell>
                  <TableCell className="align-top">
                    <pre className="whitespace-pre-wrap break-words text-xs bg-muted p-2 rounded border">{formatValue(c.after)}</pre>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}

function formatValue(val: any): string {
  try {
    if (val === null || val === undefined) return String(val);
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (Array.isArray(val)) return JSON.stringify(val, null, 2);
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}


