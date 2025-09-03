import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

export async function POST(req: NextRequest) {
  const { amount, description, email, returnUrl, couponCode, category } = await req.json();
  if (!amount || !description || !email) {
    return NextResponse.json({ error: 'Missing amount, description, or email' }, { status: 400 });
  }
  
  // Default return URL if not provided
  const defaultReturnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/advertise/dashboard`;
  const baseReturnUrl = returnUrl || defaultReturnUrl;
  
  try {
    // Optional coupon validation on server side
    let finalAmount = amount;
    if (couponCode && category) {
      try {
        const couponsRef = collection(db, 'coupons');
        const q = query(couponsRef, where('code', '==', String(couponCode).toUpperCase()), where('active', '==', true));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const c = snap.docs[0].data() as any;
          // category check
          const cats: string[] = Array.isArray(c.categories) ? c.categories : [];
          const now = Date.now();
          const startsOk = !c.startsAt || now >= (c.startsAt.seconds ? c.startsAt.seconds * 1000 : Date.parse(c.startsAt));
          const notExpired = !c.expiresAt || now <= (c.expiresAt.seconds ? c.expiresAt.seconds * 1000 : Date.parse(c.expiresAt));
          const usageOk = typeof c.maxUses !== 'number' || (typeof c.used === 'number' ? c.used : 0) < c.maxUses;
          const minOk = typeof c.minimumAmount !== 'number' || amount >= c.minimumAmount;
          const catOk = cats.length === 0 || cats.includes(category);
          if (startsOk && notExpired && usageOk && minOk && catOk) {
            const type = c.type === 'percent' ? 'percent' : 'fixed';
            const val = Number(c.value) || 0;
            if (type === 'percent') {
              const cap = Number(c.maxDiscount) || Infinity;
              const discount = Math.min((amount * val) / 100, cap);
              finalAmount = Math.max(0, amount - discount);
            } else {
              finalAmount = Math.max(0, amount - val);
            }
          }
        }
      } catch (e) {
        // ignore coupon errors and proceed with original amount
      }
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: description },
            unit_amount: Math.round(finalAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: email,
      metadata: {
        email,
        description,
        returnUrl: baseReturnUrl,
        couponCode: couponCode || '',
        category: category || '',
        originalAmount: String(amount),
        finalAmount: String(finalAmount),
      },
      success_url: `${baseReturnUrl}?success=1`,
      cancel_url: `${baseReturnUrl}?canceled=1`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 