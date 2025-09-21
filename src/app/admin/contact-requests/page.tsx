"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, orderBy, query, updateDoc, doc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ContactRequest = {
  id: string;
  email: string;
  message: string;
  read?: boolean;
  createdAt?: { seconds: number } | Date;
};

export default function AdminContactRequestsPage() {
  const [items, setItems] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const db = getFirestore(app);
        const q = query(collection(db, "contactRequests"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as ContactRequest[];
        setItems(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const db = getFirestore(app);
      await updateDoc(doc(db, "contactRequests", id), { read: true });
      setItems(prev => prev.map(it => it.id === id ? { ...it, read: true } : it));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold">Contact Requests</h1>
        <p className="text-muted-foreground">Leads submitted via the public contact form.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No contact requests yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Message</TableHead>
                  <TableHead className="w-[180px]">Submitted</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => {
                    const created = (it.createdAt as any)?.seconds
                      ? new Date((it.createdAt as any).seconds * 1000)
                      : (it.createdAt ? new Date(it.createdAt as any) : undefined);
                    return (
                      <TableRow key={it.id}>
                        <TableCell className="font-medium">{it.email}</TableCell>
                        <TableCell>
                          <div className="max-w-xl whitespace-pre-wrap break-words">{it.message}</div>
                        </TableCell>
                        <TableCell>
                          {created ? (
                            <Badge variant="outline">{created.toLocaleString()}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {it.read ? (
                            <Badge variant="outline">Read</Badge>
                          ) : (
                            <Badge>Unread</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!it.read && (
                            <Button size="sm" variant="outline" onClick={() => markAsRead(it.id)}>Mark as read</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


