import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { orderId } = await req.json();
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
      return NextResponse.json({ 
        success: true, 
        captureId: captureData.purchase_units[0]?.payments?.captures[0]?.id,
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