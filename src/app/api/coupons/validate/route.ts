import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

type ReqBody = {
  couponCode?: string;
  category?: string;
  amount?: number;
  email?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { couponCode, category, amount }: ReqBody = await req.json();
    if (!couponCode || !category) {
      return NextResponse.json({ valid: false, reason: 'Missing couponCode or category' }, { status: 400 });
    }
    const couponsRef = collection(db, 'coupons');
    const q = query(couponsRef, where('code', '==', couponCode.toUpperCase()), where('active', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) {
      return NextResponse.json({ valid: false, reason: 'Invalid coupon' }, { status: 200 });
    }
    const docData = snap.docs[0].data() as any;
    const now = Date.now();
    if (docData.startsAt && now < (docData.startsAt.seconds ? docData.startsAt.seconds * 1000 : Date.parse(docData.startsAt))) {
      return NextResponse.json({ valid: false, reason: 'Coupon not started' }, { status: 200 });
    }
    if (docData.expiresAt && now > (docData.expiresAt.seconds ? docData.expiresAt.seconds * 1000 : Date.parse(docData.expiresAt))) {
      return NextResponse.json({ valid: false, reason: 'Coupon expired' }, { status: 200 });
    }
    const categories: string[] = Array.isArray(docData.categories) ? docData.categories : [];
    if (categories.length > 0 && !categories.includes(category)) {
      return NextResponse.json({ valid: false, reason: 'Not applicable to this category' }, { status: 200 });
    }
    const minimum = typeof docData.minimumAmount === 'number' ? docData.minimumAmount : 0;
    const amt = typeof amount === 'number' ? amount : 0;
    if (minimum > 0 && amt > 0 && amt < minimum) {
      return NextResponse.json({ valid: false, reason: 'Minimum amount not met' }, { status: 200 });
    }
    const type = docData.type === 'percent' ? 'percent' : 'fixed';
    const value = Number(docData.value) || 0;
    let discount = 0;
    if (type === 'percent' && amt > 0) {
      const cap = Number(docData.maxDiscount) || Infinity;
      discount = Math.min((amt * value) / 100, cap);
    } else if (type === 'fixed') {
      discount = value;
    }
    const maxUses = typeof docData.maxUses === 'number' ? docData.maxUses : undefined;
    const used = typeof docData.used === 'number' ? docData.used : 0;
    if (maxUses !== undefined && used >= maxUses) {
      return NextResponse.json({ valid: false, reason: 'Coupon usage limit reached' }, { status: 200 });
    }
    return NextResponse.json({
      valid: true,
      type,
      value,
      discount,
      minimumAmount: minimum,
      categories,
    });
  } catch (e: any) {
    return NextResponse.json({ valid: false, error: e?.message || 'Validation failed' }, { status: 500 });
  }
}


