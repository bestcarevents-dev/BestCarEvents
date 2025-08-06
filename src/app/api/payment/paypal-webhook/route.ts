import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { createPaymentNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  console.log('Received PayPal webhook request');
  
  try {
    const body = await req.json();
    console.log('PayPal webhook body:', body);
    
    // Handle different PayPal webhook events
    if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const capture = body.resource;
      console.log('Processing PayPal payment capture:', capture.id);
      
      const email = capture.payer?.email_address;
      const amount = parseFloat(capture.amount.value);
      const currency = capture.amount.currency_code;
      const description = capture.custom_id || capture.description || 'PayPal Payment';
      
      if (!email) {
        console.error('Missing email in PayPal capture');
        return NextResponse.json({ error: 'Missing email in capture' }, { status: 400 });
      }
      
      // Map description to Firestore field (similar to Stripe)
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
            partnerEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          };
          break;
        case 'Silver Partner':
          update = {
            partnerSilverPackage: increment(1),
            categoryBannerRemaining: increment(2),
            featuredListingRemaining: increment(1),
            standardNewsletterRemaining: increment(12),
            silverPartner: true,
            partnerStart: new Date(),
            partnerEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          };
          break;
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
          return NextResponse.json({ error: 'Unknown product description' }, { status: 400 });
      }
      
      // Update user by email
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const userSnap = await getDocs(q);
        
        if (!userSnap.empty) {
          const userDoc = userSnap.docs[0];
          await updateDoc(userDoc.ref, update);
          console.log('User updated successfully for PayPal payment');
        } else {
          console.warn('User not found for PayPal payment email:', email);
        }
        
        // Create payment record in database
        const paymentData = {
          amount: amount,
          currency: currency,
          description: description,
          customerEmail: email,
          paymentMethod: 'PayPal',
          status: 'completed',
          createdAt: serverTimestamp(),
          paymentId: capture.id,
          paypalCaptureId: capture.id
        };
        
        await addDoc(collection(db, 'payments'), paymentData);
        console.log('PayPal payment record created successfully');
        
        // Create notification (non-blocking)
        try {
          await createPaymentNotification({
            amount: amount,
            description: description,
            customerEmail: email,
            paymentId: capture.id,
            paymentMethod: 'PayPal'
          });
          console.log('PayPal payment notification created successfully');
        } catch (notificationError) {
          console.error('Error creating PayPal payment notification:', notificationError);
          // Don't fail the payment process if notification fails
        }
        
        return NextResponse.json({ received: true, updated: update });
      } catch (firestoreError) {
        console.error('Firestore error in PayPal webhook:', firestoreError);
        return NextResponse.json({ error: 'Firestore error', details: String(firestoreError) }, { status: 500 });
      }
    }
    
    console.log('Unhandled PayPal event type:', body.event_type);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 