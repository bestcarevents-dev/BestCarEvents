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

export function getBrandedSender(): string {
  return 'BestCarEvents <info@bestcarevents.com>';
}

export interface ApprovalEmailPayload {
  to: string;
  listingType: 'event' | 'car' | 'hotel' | 'club' | 'auction' | 'service' | 'newsletter';
  action: 'approved' | 'rejected';
  listingName?: string;
}

export function buildApprovalEmail({ to, listingType, action, listingName }: ApprovalEmailPayload) {
  const prettyType = listingType.charAt(0).toUpperCase() + listingType.slice(1);
  const subject = action === 'approved'
    ? `Your ${prettyType} listing is approved`
    : `Update on your ${prettyType} listing`;

  const safeName = listingName || prettyType;
  const title = action === 'approved' ? 'Congratulations' : 'Status Update';
  const lead = action === 'approved'
    ? `We’re delighted to let you know your ${prettyType.toLowerCase()} listing${safeName ? ` “${safeName}”` : ''} has been approved and is now live on BestCarEvents.`
    : `We’ve reviewed your ${prettyType.toLowerCase()} listing${safeName ? ` “${safeName}”` : ''}. Unfortunately, it wasn’t approved at this time.`;

  const gold = '#C9A227';
  const slate = '#0f172a';
  const muted = '#64748b';
  const border = '#e2e8f0';

  const nextSteps = action === 'approved'
    ? 'You can manage or update your listing from your dashboard anytime.'
    : 'Feel free to update and resubmit. Our team is happy to help with any questions.';

  const html = `
  <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:${slate}; background:#fff;">
    <div style="max-width:640px; margin:0 auto;">
      <div style="padding:20px 0; text-align:center;">
        <div style="font-size:22px; font-weight:700; color:${slate};">BestCarEvents</div>
        <div style="font-size:12px; color:${muted}; letter-spacing:0.08em; text-transform:uppercase;">Listing ${action === 'approved' ? 'Approved' : 'Update'}</div>
      </div>
      <div style="border:1px solid ${border}; border-radius:12px; overflow:hidden;">
        <div style="background:${slate}; color:white; padding:16px 20px;">
          <div style="font-size:16px; font-weight:600;">${title}</div>
          <div style="font-size:13px; opacity:0.85;">${safeName ? escapeHtml(safeName) : prettyType}</div>
        </div>
        <div style="padding:20px;">
          <p style="margin:0 0 12px; line-height:1.6;">${lead}</p>
          <p style="margin:0 0 12px; line-height:1.6; color:${muted};">${nextSteps}</p>
          <p style="margin:0; line-height:1.6; color:${muted};">If you need assistance, just reply to this email—our team is here to help.</p>
        </div>
      </div>
      <div style="text-align:center; font-size:12px; color:${muted}; margin-top:16px;">© ${new Date().getFullYear()} BestCarEvents</div>
    </div>
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

  const subject = `Thank you for your purchase • ${prettyAmount}`;

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
  <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:${slate}; background:#fff;">
    <div style="max-width:640px; margin:0 auto;">
      <div style="padding:20px 0; text-align:center;">
        <div style="font-size:22px; font-weight:700; color:${slate};">BestCarEvents</div>
        <div style="font-size:12px; color:${muted}; letter-spacing:0.08em; text-transform:uppercase;">Payment Receipt</div>
      </div>
      <div style="border:1px solid ${border}; border-radius:12px; overflow:hidden;">
        <div style="background:${slate}; color:white; padding:16px 20px;">
          <div style="font-size:16px; font-weight:600;">Thank you for your purchase</div>
          <div style="font-size:13px; opacity:0.85;">We appreciate your business. Your receipt is below.</div>
        </div>
        <div style="padding:20px;">
          <p style="margin:0 0 12px; line-height:1.6; color:${muted};">This email confirms your order with BestCarEvents. Keep it for your records.</p>
          <table style="width:100%; border-collapse:collapse;">
            ${rows.join('')}
            <tr><td colspan="2" style="padding-top:16px; border-top:1px solid ${border};"></td></tr>
            <tr>
              <td style="padding:12px 0; color:${muted};">Paid</td>
              <td style="padding:12px 0; text-align:right; color:${gold}; font-weight:700;">${prettyAmount}</td>
            </tr>
          </table>
          <div style="margin-top:12px; font-size:13px; color:${slate};">What’s next?</div>
          <ul style="margin:8px 0 0 18px; padding:0; color:${muted}; font-size:12px; line-height:1.6;">
            <li>Manage your purchases anytime from your dashboard.</li>
            <li>Need help? Reply to this email and our team will assist you promptly.</li>
          </ul>
        </div>
      </div>
      <div style="text-align:center; font-size:12px; color:${muted}; margin-top:16px;">© ${new Date().getFullYear()} BestCarEvents</div>
    </div>
  </div>`;

  return { to, subject, html };
}

export interface EventRegistrationEmailPayload {
  to: string;
  eventName: string;
  attendeeEmail: string;
}

export function buildEventRegistrationEmail({ to, eventName, attendeeEmail }: EventRegistrationEmailPayload) {
  const slate = '#0f172a';
  const muted = '#64748b';
  const border = '#e2e8f0';
  const subject = `New registration • ${eventName}`;
  const html = `
  <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:${slate}; background:#fff;">
    <div style="max-width:640px; margin:0 auto;">
      <div style="padding:20px 0; text-align:center;">
        <div style="font-size:22px; font-weight:700; color:${slate};">BestCarEvents</div>
        <div style="font-size:12px; color:${muted}; letter-spacing:0.08em; text-transform:uppercase;">Event Registration</div>
      </div>
      <div style="border:1px solid ${border}; border-radius:12px; overflow:hidden;">
        <div style="background:${slate}; color:white; padding:16px 20px; font-size:16px; font-weight:600;">Someone registered for your event</div>
        <div style="padding:20px;">
          <p style="margin:0 0 12px; line-height:1.6;">Your event “${escapeHtml(eventName)}” has a new attendee.</p>
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0; color:${slate};">Attendee</td>
              <td style="padding:6px 0; color:${slate}; text-align:right; font-weight:600;">${escapeHtml(attendeeEmail)}</td>
            </tr>
          </table>
          <p style="margin:12px 0 0; font-size:12px; color:${muted};">You can view all attendees in your dashboard.</p>
        </div>
      </div>
      <div style="text-align:center; font-size:12px; color:${muted}; margin-top:16px;">© ${new Date().getFullYear()} BestCarEvents</div>
    </div>
  </div>`;

  return { to, subject, html };
}

export interface ForumActivityEmailPayload {
  to: string;
  postTitle: string;
  actorName: string;
  kind: 'comment' | 'reply';
  preview?: string;
}

export function buildForumActivityEmail({ to, postTitle, actorName, kind, preview }: ForumActivityEmailPayload) {
  const slate = '#0f172a';
  const muted = '#64748b';
  const border = '#e2e8f0';
  const subject = kind === 'reply' ? `New reply on your post • ${postTitle}` : `New comment on your post • ${postTitle}`;
  const html = `
  <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:${slate}; background:#fff;">
    <div style="max-width:640px; margin:0 auto;">
      <div style="padding:20px 0; text-align:center;">
        <div style="font-size:22px; font-weight:700; color:${slate};">BestCarEvents</div>
        <div style="font-size:12px; color:${muted}; letter-spacing:0.08em; text-transform:uppercase;">Forum Notification</div>
      </div>
      <div style="border:1px solid ${border}; border-radius:12px; overflow:hidden;">
        <div style="background:${slate}; color:white; padding:16px 20px; font-size:16px; font-weight:600;">${escapeHtml(actorName)} ${kind === 'reply' ? 'replied' : 'commented'} on your post</div>
        <div style="padding:20px;">
          <p style="margin:0 0 12px; line-height:1.6;">Post: “${escapeHtml(postTitle)}”.</p>
          ${preview ? `<blockquote style="margin:0; padding:12px; border-left:3px solid ${border}; background:#f8fafc; color:${slate}; font-size:14px;">${escapeHtml(preview)}</blockquote>` : ''}
          <p style="margin:12px 0 0; font-size:12px; color:${muted};">Open the post to join the conversation.</p>
        </div>
      </div>
      <div style="text-align:center; font-size:12px; color:${muted}; margin-top:16px;">© ${new Date().getFullYear()} BestCarEvents</div>
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


