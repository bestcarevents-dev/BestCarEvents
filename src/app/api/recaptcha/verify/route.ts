import { NextRequest, NextResponse } from 'next/server';
// Classic reCAPTCHA v3 server verification via siteverify

// Expect the following environment variables to be configured in the deployment environment:
// - GOOGLE_CLOUD_PROJECT (or RECAPTCHA_PROJECT_ID)
// - RECAPTCHA_SITE_KEY (optional; fallback to body.siteKey)
// - GOOGLE_APPLICATION_CREDENTIALS or workload identity for server to access reCAPTCHA Enterprise

export async function POST(req: NextRequest) {
  try {
    const { token, action } = await req.json();
    if (!token || !action) {
      return NextResponse.json({ ok: false, error: 'missing_token_or_action' }, { status: 400 });
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ ok: false, error: 'missing_secret_key' }, { status: 500 });
    }

    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await verifyRes.json();

    // data: { success, score, action, hostname, challenge_ts, ... }
    if (!data.success) {
      return NextResponse.json({ ok: false, valid: false, errors: data['error-codes'] || [] }, { status: 200 });
    }
    if (data.action && data.action !== action) {
      return NextResponse.json({ ok: false, valid: false, reason: 'action_mismatch' }, { status: 200 });
    }
    const score = typeof data.score === 'number' ? data.score : 0;
    const passing = score >= 0.3;
    return NextResponse.json({ ok: true, valid: true, score, passing }, { status: 200 });
  } catch (err: any) {
    console.error('reCAPTCHA verify error', err);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}


