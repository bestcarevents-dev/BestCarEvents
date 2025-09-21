import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { createPaymentNotification } from '@/lib/notifications';
import { getResendClient, buildReceiptEmail } from '@/lib/email/resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

export async function POST(req: NextRequest) {
  console.log('Received Stripe webhook request');
  const sig = req.headers.get('stripe-signature');
  const buf = await req.arrayBuffer();
  let event;
  try {
    console.log('Constructing Stripe event');
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    console.log('Stripe event constructed:', event.type);
  } catch (err: any) {
    console.error('Webhook Error:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('Processing checkout.session.completed event:', session.id);
    const email = session.customer_email || session.metadata?.email;
    const description = session.metadata?.description || '';
    console.log('Extracted email:', email, 'description:', description);
    if (!email || !description) {
      console.error('Missing email or description in session.', { email, description });
      return NextResponse.json({ error: 'Missing email or description in session.' }, { status: 400 });
    }
    
    // Map description to Firestore field
    let update: Record<string, any> = {};
    switch (description) {
      case 'Homepage Banner (All Pages + Category)':
        update = { homepageBannerRemaining: increment(1) };
        break;
      case 'Category Page Banner':
        update = { categoryBannerRemaining: increment(1) };
        break;
      case 'Featured Listing':
        update = { featuredListingRemaining: increment(1) };
        break;
      case 'Standard Listing':
        update = { standardListingRemaining: increment(1) };
        break;
      case 'Premium Mention':
        update = { premiumNewsletterRemaining: increment(1) };
        break;
      case 'Standard Mention':
        update = { standardNewsletterRemaining: increment(1) };
        break;
      case 'Gold Package':
        update = {
          goldPackage: increment(1),
          homepageBannerRemaining: increment(1),
          featuredListingRemaining: increment(1),
          premiumNewsletterRemaining: increment(12),
        };
        break;
      case 'Silver Package':
        update = {
          silverPackage: increment(1),
          categoryBannerRemaining: increment(1),
          featuredListingRemaining: increment(1),
          standardNewsletterRemaining: increment(12),
        };
        break;
      case 'Gold Partner':
        update = {
          partnerGoldPackage: increment(1),
          categoryBannerRemaining: increment(2),
          homepageBannerRemaining: increment(1),
          featuredListingRemaining: increment(1),
          premiumNewsletterRemaining: increment(12),
          goldPartner: true,
          partnerStart: new Date(),
          partnerEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        };
        break;
      // Partner packages
      case 'Silver Partner':
        update = {
          partnerSilverPackage: increment(1),
          categoryBannerRemaining: increment(2),
          featuredListingRemaining: increment(1),
          standardNewsletterRemaining: increment(12),
          silverPartner: true,
          partnerStart: new Date(),
          partnerEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        };
        break;
      // Car listing purchases
      case 'Basic Listing':
        update = { cars_basicListing: increment(1) };
        break;
      case 'Enhanced Listing':
        update = { cars_enhancedListing: increment(1) };
        break;
      case 'Premium Listing':
        update = { cars_premiumListing: increment(1) };
        break;
      case 'Exclusive Banner Placement':
        update = { cars_exclusiveBanner: increment(1) };
        break;
      case 'Featured in Newsletters':
        update = { cars_newsletterFeature: increment(1) };
        break;
      case 'Car Auction Listing':
        update = { cars_auctionListing: increment(1) };
        break;
      default:
        console.error('Unknown product description:', description);
        return NextResponse.json({ error: 'Unknown product description.' }, { status: 400 });
    }
    console.log('Firestore update object:', update);
    
    // Update user by email
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      console.log('Querying Firestore for user with email:', email);
      const userSnap = await getDocs(q);
      console.log('Firestore query result size:', userSnap.size);
      if (userSnap.empty) {
        console.error('User not found for email:', email);
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }
      const userDoc = userSnap.docs[0];
      console.log('Updating user doc ref:', userDoc.ref.path, 'with:', update);
      await updateDoc(userDoc.ref, update);
      console.log('Firestore update successful');
      
      // Create payment record in database
      const paymentData = {
        amount: session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
        currency: session.currency?.toUpperCase() || 'USD',
        description: description,
        customerEmail: email,
        paymentMethod: 'Stripe',
        status: 'completed',
        createdAt: serverTimestamp(),
        paymentId: session.id,
        stripeSessionId: session.id
      };
      
      await addDoc(collection(db, 'payments'), paymentData);
      console.log('Payment record created successfully');
      
      // Create notification (non-blocking)
      try {
        await createPaymentNotification({
          amount: paymentData.amount,
          description: description,
          customerEmail: email,
          paymentId: session.id,
          paymentMethod: 'Stripe'
        });
        console.log('Payment notification created successfully');
      } catch (notificationError) {
        console.error('Error creating payment notification:', notificationError);
        // Don't fail the payment process if notification fails
      }

      // Send receipt email (fire-and-forget; never block or throw)
      try {
        const resend = getResendClient();
        const { subject, html } = buildReceiptEmail({
          to: email,
          amount: paymentData.amount,
          currency: paymentData.currency,
          description: description,
          paymentMethod: 'Stripe',
          paymentId: session.id,
          metadata: {
            stripeSessionId: session.id,
            stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent as any)?.id || null,
          },
        });
        // Do not await; ensure failure never impacts main flow
        resend.emails.send({ from: 'receipts@bestcarevents.com', to: [email], subject, html })
          .then((r) => console.log('Receipt email queued (Stripe):', (r as any)?.id || 'ok'))
          .catch((e) => console.error('Receipt email error (Stripe):', e));
      } catch (emailError) {
        console.error('Error preparing/sending receipt email (Stripe):', emailError);
      }
      
      return NextResponse.json({ received: true, updated: update });
    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      return NextResponse.json({ error: 'Firestore error', details: String(firestoreError) }, { status: 500 });
    }
  }
  console.log('Unhandled event type:', event.type);
  return NextResponse.json({ received: true });
} 