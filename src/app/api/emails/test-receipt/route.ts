import { NextRequest, NextResponse } from 'next/server';
import { getResendClient, buildReceiptEmail } from '@/lib/email/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { to } = await req.json();
    if (!to) {
      return NextResponse.json({ error: 'Missing to' }, { status: 400 });
    }
    const resend = getResendClient();
    const { subject, html } = buildReceiptEmail({
      to,
      amount: 49.0,
      currency: 'EUR',
      description: 'Test Receipt Email',
      paymentMethod: 'Stripe',
      paymentId: `test_${Date.now()}`,
      metadata: { stripeSessionId: 'cs_test_123' }
    });
    const result = await resend.emails.send({ from: 'info@bestcarevents.com', to: [to], subject, html });
    return NextResponse.json({ ok: true, id: (result as any)?.id || null });
  } catch (err: any) {
    console.error('POST /api/emails/test-receipt error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}


