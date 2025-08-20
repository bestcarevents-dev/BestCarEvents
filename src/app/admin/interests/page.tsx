"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AdminInterestsPage() {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [loading, setLoading] = useState(true);
  const [interests, setInterests] = useState<{ id: string; name: string }[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchInterests = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "interests"));
      setInterests(snap.docs.map(d => ({ id: d.id, name: (d.data() as any)?.name || "" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {
      fetchInterests();
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newInterest.trim();
    if (!name) return;
    await addDoc(collection(db, "interests"), { name });
    setNewInterest("");
    await fetchInterests();
  };

  const startEdit = (item: { id: string; name: string }) => {
    setEditId(item.id);
    setEditName(item.name);
  };

  const saveEdit = async () => {
    if (!editId) return;
    const name = editName.trim();
    if (!name) return;
    await updateDoc(doc(db, "interests", editId), { name });
    setEditId(null);
    setEditName("");
    await fetchInterests();
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this interest?")) return;
    await deleteDoc(doc(db, "interests", id));
    await fetchInterests();
  };

  return (
    <div className="container mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Manage Interests</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-2 mb-6">
            <Input
              placeholder="Add a new interest (e.g., Supercars)"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
            />
            <Button type="submit">Add</Button>
          </form>

          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : interests.length === 0 ? (
            <div className="text-sm text-muted-foreground">No interests yet.</div>
          ) : (
            <ul className="space-y-2">
              {interests.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  {editId === item.id ? (
                    <>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1" />
                      <Button variant="outline" type="button" onClick={cancelEdit}>Cancel</Button>
                      <Button type="button" onClick={saveEdit}>Save</Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 py-2 px-3 rounded border bg-white">{item.name}</div>
                      <Button variant="outline" type="button" onClick={() => startEdit(item)}>Rename</Button>
                      <Button variant="destructive" type="button" onClick={() => handleDelete(item.id)}>Delete</Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 