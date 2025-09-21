import { NextRequest, NextResponse } from 'next/server';
import { getResendClient, getBrandedSender, buildEventRegistrationEmail } from '@/lib/email/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { to, eventName, attendeeEmail } = await req.json();
    if (!to || !eventName || !attendeeEmail) {
      return NextResponse.json({ error: 'Missing to, eventName, or attendeeEmail' }, { status: 400 });
    }
    const resend = getResendClient();
    const { subject, html } = buildEventRegistrationEmail({ to, eventName, attendeeEmail });
    const result = await resend.emails.send({ from: getBrandedSender(), to: [to], subject, html });
    return NextResponse.json({ ok: true, id: (result as any)?.id || null });
  } catch (err: any) {
    console.error('POST /api/emails/event-registration error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}


