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

    // Resend rate limit: 2 requests/sec. Batch using BCC to avoid exposing emails and to reduce requests.
    const BATCH_SIZE = 40;
    const RATE_DELAY_MS = 600; // ~1.6 req/sec to be safe
    const MAX_RETRIES = 3;

    const batches: string[][] = [];
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      batches.push(recipients.slice(i, i + BATCH_SIZE));
    }

    let sent = 0;

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      let attempt = 0;
      while (attempt < MAX_RETRIES) {
        try {
          // Send a single message with BCC so recipients are hidden
          // Use our own inbox as the primary "to" address
          await resend.emails.send({
            from: getBrandedSender(),
            to: ['info@bestcarevents.com'],
            bcc: batch,
            subject,
            html,
          } as any);
          sent += batch.length;
          break;
        } catch (e: any) {
          const isRateLimited = e?.statusCode === 429 || e?.name === 'rate_limit_exceeded';
          attempt += 1;
          if (isRateLimited && attempt < MAX_RETRIES) {
            await sleep(RATE_DELAY_MS * (attempt + 1));
            continue;
          }
          // Swallow other errors and continue
          break;
        }
      }
      // Rate limit pacing between batches
      if (i < batches.length - 1) {
        await sleep(RATE_DELAY_MS);
      }
    }

    return NextResponse.json({ ok: true, sent, total: recipients.length, batches: batches.length });
  } catch (err: any) {
    console.error('POST /api/emails/newsletter-send error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}


