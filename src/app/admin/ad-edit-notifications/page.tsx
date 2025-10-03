"use client";

import { useEffect, useMemo, useState } from "react";
import { app } from "@/lib/firebase";
import { getFirestore, collection, query, where, getDocs, orderBy, limit, updateDoc, doc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { markNotificationAsRead } from "@/lib/notifications";

export default function AdminAdEditNotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);
  const db = useMemo(() => getFirestore(app), []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "notifications"),
          where("type", "==", "partner_ad_edit"),
          orderBy("createdAt", "desc"),
          limit(200)
        );
        const snap = await getDocs(q as any);
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setItems(list);
      } catch (e) {
        console.error("Failed to load ad edit notifications", e);
      } finally {
        setLoading(false);
      }
    };
    load();
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
    </div>
  );
}


