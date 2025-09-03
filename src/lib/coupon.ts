export type CouponValidation = {
  valid: boolean;
  type?: 'percent' | 'fixed';
  value?: number;
  discount?: number;
  minimumAmount?: number;
  categories?: string[];
  reason?: string;
};

export async function validateCoupon(couponCode: string, category: string, amount: number): Promise<CouponValidation> {
  try {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ couponCode, category, amount }),
    });
    return await res.json();
  } catch (e) {
    return { valid: false, reason: 'Network error' };
  }
}


