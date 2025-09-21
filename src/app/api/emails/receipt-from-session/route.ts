import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getResendClient, buildReceiptEmail, getBrandedSender } from '@/lib/email/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email = session.customer_email || (session.metadata as any)?.email;
    const description = (session.metadata as any)?.description || 'Purchase';
    const amount = (session.amount_total || 0) / 100;
    const currency = (session.currency || 'eur').toUpperCase();

    if (!email) return NextResponse.json({ error: 'No email on session' }, { status: 400 });

    const resend = getResendClient();
    const { subject, html } = buildReceiptEmail({
      to: email,
      amount,
      currency,
      description,
      paymentMethod: 'Stripe',
      paymentId: session.id,
      metadata: {
        stripeSessionId: session.id,
        stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent as any)?.id || null,
      },
    });
    const result = await resend.emails.send({ from: getBrandedSender(), to: [email], subject, html });
    return NextResponse.json({ ok: true, id: (result as any)?.id || null });
  } catch (err: any) {
    console.error('POST /api/emails/receipt-from-session error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}


