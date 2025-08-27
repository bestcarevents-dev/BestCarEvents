"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminInterestsPage() {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [loading, setLoading] = useState(true);
  const [interests, setInterests] = useState<{ id: string; name: string }[]>([]);
  const [newInterest, setNewInterest] = useState("");
  // Lifestyle & Networking within same collection using `section: 'lifestyle-networking'`
  const [lnItems, setLnItems] = useState<{ id: string; name: string; group?: string; active?: boolean }[]>([]);
  const [newLnName, setNewLnName] = useState("");
  const [newLnGroup, setNewLnGroup] = useState("");

  // Users tab
  type AdminUser = {
    id: string;
    email?: string;
    createdAt?: any;
    firstName?: string;
    lastName?: string;
    nationality?: string;
    photoURL?: string | null;
    interests?: string[];
    interestIds?: string[];
    lifestyleNetworking?: string[];
    lifestyleNetworkingIds?: string[];
  };
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchInterests = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "interests"));
      const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setInterests(items.filter(it => !it.section || it.section === 'interest').map(it => ({ id: it.id, name: it.name || "" })));
      setLnItems(items.filter(it => it.section === 'lifestyle-networking').map(it => ({ id: it.id, name: it.name || "", group: it.group, active: it.active !== false })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {
      fetchInterests();
      fetchUsers();
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

  const handleAddLn = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newLnName.trim();
    if (!name) return;
    await addDoc(collection(db, "interests"), { name, section: 'lifestyle-networking', group: newLnGroup || null, active: true });
    setNewLnName("");
    setNewLnGroup("");
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

  const toggleLnActive = async (id: string, next: boolean) => {
    await updateDoc(doc(db, "interests", id), { active: next });
    await fetchInterests();
  };

  const renameLn = async (id: string, name: string) => {
    const nm = name.trim();
    if (!nm) return;
    await updateDoc(doc(db, "interests", id), { name: nm });
    await fetchInterests();
  };

  const setLnGroup = async (id: string, group: string) => {
    await updateDoc(doc(db, "interests", id), { group: group || null });
    await fetchInterests();
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const rows: AdminUser[] = snap.docs.map(d => {
        const data = (d.data() as any) || {};
        return {
          id: d.id,
          email: data.email,
          createdAt: data.createdAt,
          firstName: data.firstName,
          lastName: data.lastName,
          nationality: data.nationality || undefined,
          photoURL: data.photoURL || null,
          interests: Array.isArray(data.interests) ? data.interests : [],
          interestIds: Array.isArray(data.interestIds) ? data.interestIds : [],
          lifestyleNetworking: Array.isArray(data.lifestyleNetworking) ? data.lifestyleNetworking : [],
          lifestyleNetworkingIds: Array.isArray(data.lifestyleNetworkingIds) ? data.lifestyleNetworkingIds : [],
        } as AdminUser;
      });
      setUsers(rows);
    } finally {
      setUsersLoading(false);
    }
  };

  const exportUsersCsv = () => {
    const headers = [
      "id","email","firstName","lastName","nationality","createdAt","interests","interestIds","lifestyleNetworking","lifestyleNetworkingIds"
    ];
    const lines = [headers.join(",")];
    for (const u of users) {
      const row = [
        u.id || "",
        u.email || "",
        u.firstName || "",
        u.lastName || "",
        u.nationality || "",
        u.createdAt && (u.createdAt.seconds ? new Date(u.createdAt.seconds * 1000).toISOString() : (typeof u.createdAt === 'string' ? u.createdAt : "")) || "",
        (u.interests || []).join("; "),
        (u.interestIds || []).join("; "),
        (u.lifestyleNetworking || []).join("; "),
        (u.lifestyleNetworkingIds || []).join("; "),
      ];
      const escaped = row.map(val => `"${String(val).replace(/"/g, '""')}"`);
      lines.push(escaped.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter(u => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return true;
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    return (
      (u.email || '').toLowerCase().includes(term) ||
      fullName.includes(term) ||
      (u.nationality || '').toLowerCase().includes(term)
    );
  });

  const formatDate = (ts: any) => {
    try {
      if (!ts) return '';
      if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
      const d = new Date(ts);
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
    } catch { return ''; }
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
    <div className="container mx-auto max-w-5xl">
      <Tabs defaultValue="interests" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="interests">Interests</TabsTrigger>
          <TabsTrigger value="ln">Lifestyle & Networking</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="interests">
          <Card>
            <CardHeader>
              <CardTitle>Manage Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Add or rename interest chips. These appear on the account page.</p>
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
                          <div className="flex-1 py-2 px-3 rounded border bg-background text-foreground">{item.name}</div>
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
        </TabsContent>

        <TabsContent value="ln">
          <Card>
            <CardHeader>
              <CardTitle>Manage Lifestyle & Networking</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <p className="text-sm text-muted-foreground">Create categories and group them. These appear under "Lifestyle & Networking" on the account page.</p>
              <form onSubmit={handleAddLn} className="grid grid-cols-1 sm:grid-cols-[1fr_240px_auto] gap-2 items-center">
                <Input placeholder="Category name (e.g., Track Days)" value={newLnName} onChange={(e) => setNewLnName(e.target.value)} />
                <Input placeholder="Group (e.g., Events)" value={newLnGroup} onChange={(e) => setNewLnGroup(e.target.value)} />
                <Button type="submit">Add</Button>
              </form>

              {loading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : lnItems.length === 0 ? (
                <div className="text-sm text-muted-foreground">No categories yet.</div>
              ) : (
                <div className="grid gap-3">
                  {lnItems.map(it => (
                    <div key={it.id} className="grid grid-cols-1 md:grid-cols-[1fr_200px_120px_auto] gap-2 items-center">
                      <Input defaultValue={it.name} onBlur={(e) => renameLn(it.id, e.target.value)} />
                      <Input defaultValue={it.group || ''} placeholder="Group" onBlur={(e) => setLnGroup(it.id, e.target.value)} />
                      <div className="flex items-center gap-2">
                        <Switch checked={it.active !== false} onCheckedChange={(v) => toggleLnActive(it.id, !!v)} />
                        <span className="text-sm">Active</span>
                      </div>
                      <div className="justify-self-end">
                        <Button variant="destructive" type="button" onClick={() => handleDelete(it.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-center">
                <Input placeholder="Search by name, email, nationality" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                <Button type="button" onClick={exportUsersCsv}>Export CSV</Button>
              </div>
              {usersLoading ? (
                <div className="text-sm text-muted-foreground">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-sm text-muted-foreground">No users found.</div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profile</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Nationality</TableHead>
                        <TableHead>Interests</TableHead>
                        <TableHead>Lifestyle & Networking</TableHead>
                        <TableHead>Registered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map(u => (
                        <TableRow key={u.id}>
                          <TableCell>
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-muted" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</TableCell>
                          <TableCell>{u.email || '—'}</TableCell>
                          <TableCell>{u.nationality || '—'}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[360px]">
                              {(u.interests || []).slice(0, 10).map((n, i) => (
                                <Badge key={`${u.id}-i-${i}`} variant="secondary">{n}</Badge>
                              ))}
                              {(u.interests || []).length > 10 && (
                                <Badge variant="outline">+{(u.interests || []).length - 10} more</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[360px]">
                              {(u.lifestyleNetworking || []).slice(0, 10).map((n, i) => (
                                <Badge key={`${u.id}-ln-${i}`} variant="secondary">{n}</Badge>
                              ))}
                              {(u.lifestyleNetworking || []).length > 10 && (
                                <Badge variant="outline">+{(u.lifestyleNetworking || []).length - 10} more</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(u.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Tip: Use search to quickly find users. Badges show only the first 10 items for readability; export CSV to see all.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 