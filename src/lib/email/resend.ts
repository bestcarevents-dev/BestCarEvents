import { Resend } from 'resend';

// Server-side Resend client. Requires process.env.RESEND_API to be set.
// This module should only be imported from server-side contexts (API routes, server actions).
export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API;
  if (!apiKey) {
    throw new Error('RESEND_API is not configured');
  }
  return new Resend(apiKey);
}

export interface ApprovalEmailPayload {
  to: string;
  listingType: 'event' | 'car' | 'hotel' | 'club' | 'auction' | 'service';
  action: 'approved' | 'rejected';
  listingName?: string;
}

export function buildApprovalEmail({ to, listingType, action, listingName }: ApprovalEmailPayload) {
  const prettyType = listingType.charAt(0).toUpperCase() + listingType.slice(1);
  const subject = action === 'approved'
    ? `${prettyType} listing approved`
    : `${prettyType} listing rejected`;

  const safeName = listingName || prettyType;
  const title = action === 'approved' ? 'Approved' : 'Rejected';
  const message = action === 'approved'
    ? `Good news! Your ${prettyType} listing${safeName ? ` "${safeName}"` : ''} has been approved and is now live.`
    : `We’re sorry. Your ${prettyType} listing${safeName ? ` "${safeName}"` : ''} was not approved at this time.`;

  const html = `
  <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#0f172a;">
    <h2 style="margin:0 0 8px;">${title}</h2>
    <p style="margin:0 0 12px; line-height:1.6;">${message}</p>
    <p style="margin:0; line-height:1.6;">If you have any questions, just reply to this email.</p>
  </div>`;

  return { to, subject, html };
}


export interface ReceiptEmailPayload {
  to: string;
  amount: number;
  currency: string;
  description: string;
  paymentMethod: 'Stripe' | 'PayPal';
  paymentId: string; // primary ID: Stripe session or PayPal capture
  metadata?: {
    stripeSessionId?: string | null;
    stripePaymentIntentId?: string | null;
    paypalOrderId?: string | null;
    paypalCaptureId?: string | null;
  };
  invoiceNumber?: string; // optional custom invoice number if you later add one
}

export function buildReceiptEmail(payload: ReceiptEmailPayload) {
  const { to, amount, currency, description, paymentMethod, paymentId, metadata, invoiceNumber } = payload;

  const prettyAmount = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount || 0);

  const subject = `Your BestCar receipt • ${prettyAmount}`;

  const gold = '#C9A227';
  const slate = '#0f172a';
  const muted = '#64748b';
  const border = '#e2e8f0';

  const rows: string[] = [];
  rows.push(`<tr><td style="padding:8px 0; color:${slate};">Item</td><td style="padding:8px 0; color:${slate}; font-weight:600; text-align:right;">${escapeHtml(description)}</td></tr>`);
  rows.push(`<tr><td style="padding:8px 0; color:${slate};">Amount</td><td style="padding:8px 0; color:${slate}; font-weight:600; text-align:right;">${prettyAmount}</td></tr>`);
  rows.push(`<tr><td style="padding:8px 0; color:${slate};">Payment method</td><td style="padding:8px 0; color:${slate}; text-align:right;">${paymentMethod}</td></tr>`);
  if (invoiceNumber) {
    rows.push(`<tr><td style="padding:8px 0; color:${slate};">Invoice #</td><td style="padding:8px 0; color:${slate}; text-align:right;">${escapeHtml(invoiceNumber)}</td></tr>`);
  }
  // IDs block
  rows.push(`<tr><td style="padding:8px 0; color:${slate};">Transaction ID</td><td style="padding:8px 0; color:${slate}; text-align:right;">${escapeHtml(paymentId)}</td></tr>`);
  if (paymentMethod === 'Stripe') {
    if (metadata?.stripeSessionId) rows.push(`<tr><td style="padding:8px 0; color:${slate};">Stripe Session</td><td style="padding:8px 0; color:${slate}; text-align:right;">${escapeHtml(String(metadata.stripeSessionId))}</td></tr>`);
    if (metadata?.stripePaymentIntentId) rows.push(`<tr><td style="padding:8px 0; color:${slate};">Payment Intent</td><td style="padding:8px 0; color:${slate}; text-align:right;">${escapeHtml(String(metadata.stripePaymentIntentId))}</td></tr>`);
  }
  if (paymentMethod === 'PayPal') {
    if (metadata?.paypalOrderId) rows.push(`<tr><td style="padding:8px 0; color:${slate};">PayPal Order</td><td style="padding:8px 0; color:${slate}; text-align:right;">${escapeHtml(String(metadata.paypalOrderId))}</td></tr>`);
    if (metadata?.paypalCaptureId) rows.push(`<tr><td style="padding:8px 0; color:${slate};">PayPal Capture</td><td style="padding:8px 0; color:${slate}; text-align:right;">${escapeHtml(String(metadata.paypalCaptureId))}</td></tr>`);
  }

  const html = `
  <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:${slate};">
    <div style="max-width:640px; margin:0 auto;">
      <div style="padding:20px 0; text-align:center;">
        <div style="font-size:22px; font-weight:700; color:${slate};">BestCar</div>
        <div style="font-size:12px; color:${muted}; letter-spacing:0.08em; text-transform:uppercase;">Payment Receipt</div>
      </div>
      <div style="border:1px solid ${border}; border-radius:12px; overflow:hidden;">
        <div style="background:${slate}; color:white; padding:16px 20px;">
          <div style="font-size:16px; font-weight:600;">Thank you for your purchase</div>
          <div style="font-size:13px; opacity:0.85;">A copy of your receipt is below.</div>
        </div>
        <div style="padding:20px;">
          <table style="width:100%; border-collapse:collapse;">
            ${rows.join('')}
            <tr><td colspan="2" style="padding-top:16px; border-top:1px solid ${border};"></td></tr>
            <tr>
              <td style="padding:12px 0; color:${muted};">Paid</td>
              <td style="padding:12px 0; text-align:right; color:${gold}; font-weight:700;">${prettyAmount}</td>
            </tr>
          </table>
          <div style="margin-top:16px; font-size:12px; color:${muted};">If you have any questions, reply to this email and our team will assist you.</div>
        </div>
      </div>
      <div style="text-align:center; font-size:12px; color:${muted}; margin-top:16px;">© ${new Date().getFullYear()} BestCar Events</div>
    </div>
  </div>`;

  return { to, subject, html };
}

function escapeHtml(input: string) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


