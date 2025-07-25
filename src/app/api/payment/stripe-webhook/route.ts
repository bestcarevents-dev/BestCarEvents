import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // TODO: Implement Stripe webhook handling
  // Use process.env.STRIPE_WEBHOOK_SECRET
  // On successful payment, update Firestore user quota
  return NextResponse.json({ received: true });
} 