import { NextRequest, NextResponse } from 'next/server';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

// Expect the following environment variables to be configured in the deployment environment:
// - GOOGLE_CLOUD_PROJECT (or RECAPTCHA_PROJECT_ID)
// - RECAPTCHA_SITE_KEY (optional; fallback to body.siteKey)
// - GOOGLE_APPLICATION_CREDENTIALS or workload identity for server to access reCAPTCHA Enterprise

export async function POST(req: NextRequest) {
  try {
    const { token, action, siteKey } = await req.json();
    if (!token || !action) {
      return NextResponse.json({ ok: false, error: 'missing_token_or_action' }, { status: 400 });
    }

    const projectId = process.env.RECAPTCHA_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    const key = siteKey || process.env.RECAPTCHA_SITE_KEY;
    if (!projectId) {
      return NextResponse.json({ ok: false, error: 'missing_project_id' }, { status: 500 });
    }

    const client = new RecaptchaEnterpriseServiceClient();
    const projectPath = client.projectPath(projectId);

    const request = {
      assessment: {
        event: {
          token,
          siteKey: key,
        },
      },
      parent: projectPath,
    } as any;

    const [response] = await client.createAssessment(request);

    const valid = response?.tokenProperties?.valid;
    const receivedAction = response?.tokenProperties?.action || '';
    const score = response?.riskAnalysis?.score ?? 0;

    if (!valid) {
      const reason = String(response?.tokenProperties?.invalidReason || 'unknown');
      return NextResponse.json({ ok: false, valid: false, reason }, { status: 200 });
    }
    if (receivedAction !== action) {
      return NextResponse.json({ ok: false, valid: false, reason: 'action_mismatch' }, { status: 200 });
    }

    // Adjust the threshold as needed (0.1-1.0). 0.5 is a common starting point.
    const passing = score >= 0.5;
    return NextResponse.json({ ok: true, valid: true, score, passing }, { status: 200 });
  } catch (err: any) {
    console.error('reCAPTCHA verify error', err);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}


