import { NextRequest, NextResponse } from 'next/server';
import { getResendClient, buildApprovalEmail, ApprovalEmailPayload } from '@/lib/email/resend';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ApprovalEmailPayload> & { from?: string };
    const { to, listingType, action, listingName, from } = body;

    if (!to || !listingType || !action) {
      return NextResponse.json({ error: 'Missing required fields: to, listingType, action' }, { status: 400 });
    }

    const resend = getResendClient();
    const { subject, html } = buildApprovalEmail({ to, listingType, action, listingName });

    const sender = from || 'info@bestcarevents.com';

    const result = await resend.emails.send({
      from: sender,
      to: [to],
      subject,
      html,
    });

    return NextResponse.json({ ok: true, id: (result as any)?.id || null });
  } catch (err: any) {
    console.error('POST /api/emails/approval error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}


