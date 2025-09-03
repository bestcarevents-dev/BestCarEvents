"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, updateDoc, doc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Coupon = {
  id?: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  categories: string[];
  minimumAmount?: number;
  maxDiscount?: number;
  maxUses?: number;
  used?: number;
  startsAt?: any;
  expiresAt?: any;
  active: boolean;
  createdAt?: any;
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Coupon>({
    code: "",
    type: "percent",
    value: 10,
    categories: [],
    minimumAmount: 0,
    maxDiscount: 0,
    maxUses: 0,
    active: true,
  });

  const db = getFirestore(app);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const qy = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
      const snap = await getDocs(qy);
      setCoupons(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    };
    fetch();
  }, [db]);

  const handleCreate = async () => {
    if (!form.code) return;
    const payload: any = {
      ...form,
      code: form.code.toUpperCase().trim(),
      value: Number(form.value) || 0,
      minimumAmount: Number(form.minimumAmount) || 0,
      maxDiscount: Number(form.maxDiscount) || 0,
      maxUses: Number(form.maxUses) || 0,
      used: 0,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, "coupons"), payload);
    setForm({ code: "", type: "percent", value: 10, categories: [], minimumAmount: 0, maxDiscount: 0, maxUses: 0, active: true });
    const snap = await getDocs(query(collection(db, "coupons"), orderBy("createdAt", "desc")));
    setCoupons(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
  };

  const toggleActive = async (c: Coupon) => {
    if (!c.id) return;
    await updateDoc(doc(db, "coupons", c.id), { active: !c.active });
    setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, active: !x.active } : x));
  };

  const CategoryOption = ({ value, label }: { value: string; label: string }) => (
    <div
      className={`cursor-pointer border rounded px-2 py-1 text-sm ${form.categories.includes(value) ? 'border-primary text-primary' : 'border-muted text-muted-foreground'}`}
      onClick={() => {
        setForm(f => f.categories.includes(value) ? { ...f, categories: f.categories.filter(v => v !== value) } : { ...f, categories: [...f.categories, value] });
      }}
    >{label}</div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Coupons</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create Coupon</CardTitle>
          <CardDescription>Add a coupon applicable to specific categories.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Code</Label>
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g., SAVE10" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as any })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent</SelectItem>
                  <SelectItem value="fixed">Fixed amount (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{form.type === 'percent' ? 'Percent (%)' : 'Amount (EUR)'}</Label>
              <Input type="number" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Minimum Amount (EUR) - optional</Label>
              <Input type="number" value={form.minimumAmount} onChange={e => setForm({ ...form, minimumAmount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Max Discount (EUR) - for percent</Label>
              <Input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Max Uses (0 for unlimited)</Label>
              <Input type="number" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: Number(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Applicable Categories</Label>
            <div className="flex flex-wrap gap-2">
              <CategoryOption value="cars" label="Cars (Cars page & Cars Listing)" />
              <CategoryOption value="banner" label="Banners (My Ads & Advertise)" />
              <CategoryOption value="newsletter" label="Newsletter Mentions" />
              <CategoryOption value="listings" label="Events/Auction/Hotel/Club/Others Listings" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button onClick={handleCreate} disabled={!form.code}>Create Coupon</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Coupons</CardTitle>
          <CardDescription>Toggle active state as needed.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : coupons.length === 0 ? (
            <div className="text-muted-foreground">No coupons yet.</div>
          ) : (
            <div className="space-y-3">
              {coupons.map(c => (
                <div key={c.id} className="flex flex-wrap items-center gap-3 border rounded p-3">
                  <div className="font-mono font-semibold">{c.code}</div>
                  <Badge variant="outline">{c.type === 'percent' ? `${c.value}%` : `€${c.value}`}</Badge>
                  <div className="text-sm text-muted-foreground">min €{c.minimumAmount || 0}</div>
                  <div className="flex items-center gap-1">
                    {Array.isArray(c.categories) && c.categories.map(cat => (
                      <Badge key={cat} variant="secondary">{cat}</Badge>
                    ))}
                  </div>
                  <div className={`ml-auto text-sm ${c.active ? 'text-green-600' : 'text-red-600'}`}>{c.active ? 'Active' : 'Inactive'}</div>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(c)}>
                    {c.active ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
          <CardDescription>How coupons work</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>- Create a coupon with a code, discount type, and value.</p>
          <p>- Select applicable categories: 
            Cars: applies to purchases on /advertise/cars, /advertise/cars-listing, and /cars/sell.
          </p>
          <p>- Banners: applies to purchases on /advertise/my-ads and /advertise/advertise.</p>
          <p>- Newsletter: applies to purchases on /advertise/newsletter-mentions.</p>
          <p>- Listings: applies to event/auction/hotel/club/others listing purchases.</p>
          <p>- Minimum amount controls the lowest price for the coupon to apply. Max discount caps percent coupons.</p>
          <p>- Max uses controls how many total redemptions are allowed. Disable a coupon by toggling Active.</p>
        </CardContent>
      </Card>
    </div>
  );
}


