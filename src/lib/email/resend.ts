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


