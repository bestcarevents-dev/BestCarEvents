import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

export async function POST(req: NextRequest) {
  const { amount, description, email, returnUrl } = await req.json();
  if (!amount || !description || !email) {
    return NextResponse.json({ error: 'Missing amount, description, or email' }, { status: 400 });
  }
  
  // Default return URL if not provided
  const defaultReturnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/advertise/dashboard`;
  const baseReturnUrl = returnUrl || defaultReturnUrl;
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: description },
            unit_amount: Math.round(amount * 100),
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
      },
      success_url: `${baseReturnUrl}?success=1`,
      cancel_url: `${baseReturnUrl}?canceled=1`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 