"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, orderBy, query } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type ContactRequest = {
  id: string;
  email: string;
  message: string;
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


