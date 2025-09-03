"use client";

import { useEffect, useMemo, useState } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

export type PricingSettings = Record<string, any>;

export function usePricing() {
	const [pricing, setPricing] = useState<PricingSettings | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetch = async () => {
			try {
				const db = getFirestore(app);
				const ref = doc(db, "settings", "pricing");
				const snap = await getDoc(ref);
				setPricing(snap.exists() ? (snap.data() as PricingSettings) : {});
			} catch (e: any) {
				setError(e?.message || "Failed to load pricing");
			} finally {
				setLoading(false);
			}
		};
		fetch();
	}, []);

	const get = useMemo(() => {
		return function getPrice<T = number>(path: string, fallback: T): T {
			if (!pricing) return fallback;
			const parts = path.split(".");
			let cur: any = pricing;
			for (const p of parts) {
				if (cur && typeof cur === "object" && p in cur) {
					cur = cur[p];
				} else {
					return fallback;
				}
			}
			return (cur as T) ?? fallback;
		};
	}, [pricing]);

	return { pricing, loading, error, get };
}

export const CouponCategories = {
	cars: "cars",
	banner: "banner",
	newsletter: "newsletter",
	listings: "listings",
} as const;

export type CouponCategory = typeof CouponCategories[keyof typeof CouponCategories];


