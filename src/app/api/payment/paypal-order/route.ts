import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  const { amount, description, couponCode, category } = await req.json();
  if (!amount || !description) {
    return NextResponse.json({ error: 'Missing amount or description' }, { status: 400 });
  }
  
  try {
    // Optional coupon validation on server side
    let finalAmount = amount;
    if (couponCode && category) {
      try {
        const couponsRef = collection(db, 'coupons');
        const qy = query(couponsRef, where('code', '==', String(couponCode).toUpperCase()), where('active', '==', true));
        const snap = await getDocs(qy);
        if (!snap.empty) {
          const c = snap.docs[0].data() as any;
          const cats: string[] = Array.isArray(c.categories) ? c.categories : [];
          const now = Date.now();
          const ok = (!c.startsAt || now >= (c.startsAt.seconds ? c.startsAt.seconds * 1000 : Date.parse(c.startsAt)))
            && (!c.expiresAt || now <= (c.expiresAt.seconds ? c.expiresAt.seconds * 1000 : Date.parse(c.expiresAt)))
            && (typeof c.maxUses !== 'number' || (typeof c.used === 'number' ? c.used : 0) < c.maxUses)
            && (typeof c.minimumAmount !== 'number' || amount >= c.minimumAmount)
            && (cats.length === 0 || cats.includes(category));
          if (ok) {
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
      } catch {}
    }
    // Get PayPal access token
    const basicAuth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
    const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.json({ error: 'Failed to get PayPal access token' }, { status: 500 });
    }
    
    // Create order
    const orderRes = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'EUR',
              value: finalAmount.toString(),
            },
            description,
          },
        ],
        application_context: {
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/advertise/dashboard?success=1`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/advertise/dashboard?canceled=1`,
        },
      }),
    });
    
    const orderData = await orderRes.json();
    if (!orderData.id) {
      console.error('PayPal order creation failed:', orderData);
      return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      orderId: orderData.id,
      approvalUrl: orderData.links?.find((link: any) => link.rel === 'approve')?.href
    });
  } catch (error: any) {
    console.error('PayPal order creation error:', error);
    return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 });
  }
} 