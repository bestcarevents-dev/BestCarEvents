import { NextRequest, NextResponse } from 'next/server';
import { getResendClient, getBrandedSender, buildForumActivityEmail } from '@/lib/email/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { to, postTitle, actorName, kind, preview } = await req.json();
    if (!to || !postTitle || !actorName || !kind) {
      return NextResponse.json({ error: 'Missing to, postTitle, actorName, or kind' }, { status: 400 });
    }
    if (kind !== 'comment' && kind !== 'reply') {
      return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
    }
    const resend = getResendClient();
    const { subject, html } = buildForumActivityEmail({ to, postTitle, actorName, kind, preview });
    const result = await resend.emails.send({ from: getBrandedSender(), to: [to], subject, html });
    return NextResponse.json({ ok: true, id: (result as any)?.id || null });
  } catch (err: any) {
    console.error('POST /api/emails/forum-activity error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}


