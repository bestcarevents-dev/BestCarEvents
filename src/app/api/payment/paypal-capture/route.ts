import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { createPaymentNotification } from '@/lib/notifications';
import { getResendClient, buildReceiptEmail } from '@/lib/email/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { orderId, email, description, amount, currency } = await req.json();
  if (!orderId) {
    return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
  }

  try {
    // Get PayPal access token
    const basicAuth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
    const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.json({ error: 'Failed to get PayPal access token' }, { status: 500 });
    }

    // Capture the payment
    const captureRes = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await captureRes.json();
    
    if (captureData.status === 'COMPLETED') {
      const captureId = captureData.purchase_units[0]?.payments?.captures[0]?.id;
      let customerEmail = email || captureData.payer?.email_address || '';
      let paymentAmount = amount || parseFloat(captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value || '0');
      let paymentCurrency = currency || captureData.purchase_units[0]?.payments?.captures[0]?.amount?.currency_code || 'USD';
      let paymentDescription = description || captureData.purchase_units?.[0]?.description || 'PayPal Payment';

      // Fallback: fetch order details for missing fields (payer email, description)
      if (!customerEmail || !paymentDescription) {
        try {
          const orderDetailsRes = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Content-Type': 'application/json',
            },
          });
          const orderDetails = await orderDetailsRes.json();
          if (!customerEmail) customerEmail = orderDetails?.payer?.email_address || '';
          if (!paymentDescription) paymentDescription = orderDetails?.purchase_units?.[0]?.description || paymentDescription;
          if (!paymentAmount) paymentAmount = parseFloat(orderDetails?.purchase_units?.[0]?.amount?.value || `${paymentAmount}`);
          if (!paymentCurrency) paymentCurrency = orderDetails?.purchase_units?.[0]?.amount?.currency_code || paymentCurrency;
        } catch (e) {
          console.warn('Failed to fetch PayPal order details for enrichment:', e);
        }
      }
      
      // Map description to Firestore field
      let update: Record<string, any> = {};
      switch (paymentDescription) {
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
          console.error('Unknown product description:', paymentDescription);
          return NextResponse.json({ error: 'Unknown product description' }, { status: 400 });
      }
      
      // Update user by email if provided
      if (customerEmail) {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', customerEmail));
          const userSnap = await getDocs(q);
          
          if (!userSnap.empty) {
            const userDoc = userSnap.docs[0];
            await updateDoc(userDoc.ref, update);
            console.log('User updated successfully for PayPal payment');
          } else {
            console.warn('User not found for PayPal payment email:', customerEmail);
          }
        } catch (firestoreError) {
          console.error('Error updating user for PayPal payment:', firestoreError);
          // Don't fail the payment if user update fails
        }
      }
      
      // Create payment record in database
      try {
        const paymentData = {
          amount: paymentAmount,
          currency: paymentCurrency,
          description: paymentDescription,
          customerEmail: customerEmail,
          paymentMethod: 'PayPal',
          status: 'completed',
          createdAt: serverTimestamp(),
          paymentId: captureId,
          paypalOrderId: orderId,
          paypalCaptureId: captureId
        };
        
        await addDoc(collection(db, 'payments'), paymentData);
        console.log('PayPal payment record created successfully');
        
        // Create notification (non-blocking)
        try {
          await createPaymentNotification({
            amount: paymentAmount,
            description: paymentDescription,
            customerEmail: customerEmail,
            paymentId: captureId,
            paymentMethod: 'PayPal'
          });
          console.log('PayPal payment notification created successfully');
        } catch (notificationError) {
          console.error('Error creating PayPal payment notification:', notificationError);
          // Don't fail the payment process if notification fails
        }

        // Send receipt email (fire-and-forget; never block or throw)
        try {
          if (customerEmail) {
            const resend = getResendClient();
            const { subject, html } = buildReceiptEmail({
              to: customerEmail,
              amount: paymentAmount,
              currency: paymentCurrency,
              description: paymentDescription,
              paymentMethod: 'PayPal',
              paymentId: captureId,
              metadata: {
                paypalOrderId: orderId,
                paypalCaptureId: captureId,
              },
            });
            resend.emails.send({ from: 'info@bestcarevents.com', to: [customerEmail], subject, html })
              .then((r) => console.log('Receipt email queued (PayPal capture):', (r as any)?.id || 'ok'))
              .catch((e) => console.error('Receipt email error (PayPal capture):', e));
          }
        } catch (emailError) {
          console.error('Error preparing/sending receipt email (PayPal capture):', emailError);
        }
      } catch (dbError) {
        console.error('Error creating payment record:', dbError);
        // Don't fail the payment if database record creation fails
      }
      
      return NextResponse.json({ 
        success: true, 
        captureId: captureId,
        status: captureData.status 
      });
    } else {
      return NextResponse.json({ 
        error: 'Payment capture failed', 
        status: captureData.status,
        details: captureData 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('PayPal capture error:', error);
    return NextResponse.json({ error: 'Failed to capture payment' }, { status: 500 });
  }
} 