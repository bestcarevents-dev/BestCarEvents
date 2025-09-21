"use client";
import { useEffect, useRef } from 'react';

export default function StripeReceiptClient() {
  const sentRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const success = url.searchParams.get('success');
      const sessionId = url.searchParams.get('session_id');
      if (success === '1' && sessionId && sentRef.current !== sessionId) {
        sentRef.current = sessionId;
        // Call server to send a receipt using available session id (best-effort)
        fetch('/api/emails/receipt-from-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        }).catch(() => {});
      }
    } catch {}
  }, []);

  return null;
}


