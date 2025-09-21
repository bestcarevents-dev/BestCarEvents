import { NextRequest, NextResponse } from 'next/server';
import { getResendClient, getBrandedSender } from '@/lib/email/resend';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SendMode = 'all' | 'test';

export async function POST(req: NextRequest) {
  try {
    const { subject, html, mode, testEmail } = await req.json();
    if (!subject || !html) {
      return NextResponse.json({ error: 'Missing subject or html' }, { status: 400 });
    }

    const resend = getResendClient();
    let recipients: string[] = [];

    if ((mode as SendMode) === 'test') {
      if (!testEmail) return NextResponse.json({ error: 'Missing testEmail for test mode' }, { status: 400 });
      recipients = [String(testEmail)];
    } else {
      const subDoc = await getDoc(doc(db, 'newsletter', 'subscribers'));
      if (subDoc.exists()) {
        recipients = Object.keys(subDoc.data() || {}).filter((e) => /@/.test(e));
      }
      if (recipients.length === 0) {
        return NextResponse.json({ ok: true, sent: 0 });
      }
    }

    // Bounded concurrency to avoid timeouts
    const concurrency = 20;
    let sent = 0;
    const queue = [...recipients];

    async function worker() {
      while (queue.length > 0) {
        const to = queue.shift();
        if (!to) break;
        try {
          await resend.emails.send({ from: getBrandedSender(), to: [to], subject, html });
          sent += 1;
        } catch (e) {
          // Continue on errors
          // Optionally log: console.error('Newsletter send error to', to, e);
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, recipients.length) }, () => worker()));

    return NextResponse.json({ ok: true, sent });
  } catch (err: any) {
    console.error('POST /api/emails/newsletter-send error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}


