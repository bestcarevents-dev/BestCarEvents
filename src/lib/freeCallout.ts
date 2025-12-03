import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

export type FreeCalloutSection = "events" | "auctions" | "others" | "clubs" | "hotels";

export type FreeCalloutIcon = "gift" | "megaphone" | "sparkles";

export interface FreeCalloutContent {
  title: string;
  messages: string[];
  ctaHref?: string;
  ctaText?: string;
  icon: FreeCalloutIcon;
  promoLabel?: string;
  promoText?: string;
  promoHighlight?: string;
}

const DEFAULT_PROMO_LABEL = "Cars:";
const DEFAULT_PROMO_TEXT = "Free car listings until";
const DEFAULT_PROMO_HIGHLIGHT = "31st December 2025";

type FreeCalloutDoc = Partial<Record<FreeCalloutSection, Partial<FreeCalloutContent>>>;

const CONTENT_DOC_PATH = ["site", "freeCallouts"] as const;

// Defaults taken from current hardcoded values in pages
export const defaultFreeCallouts: Record<FreeCalloutSection, FreeCalloutContent> = {
  events: {
    title: "List or Join Events — Always Free",
    icon: "sparkles",
    promoLabel: DEFAULT_PROMO_LABEL,
    promoText: DEFAULT_PROMO_TEXT,
    promoHighlight: DEFAULT_PROMO_HIGHLIGHT,
    messages: [
      "Join a community of enthusiasts — No subscription.",
      "Discover premium car events — Promote or find events for free.",
      "List your event or join one — Free of charge.",
      "Worldwide exposure. Zero fees.",
    ],
  },
  auctions: {
    title: "Promote or Join Auctions — Free",
    icon: "megaphone",
    promoLabel: DEFAULT_PROMO_LABEL,
    promoText: DEFAULT_PROMO_TEXT,
    promoHighlight: DEFAULT_PROMO_HIGHLIGHT,
    messages: [
      "Join a community of enthusiasts — No subscription.",
      "Discover premium car auctions — Showcase or find auctions for free.",
      "List your auction or bid — Free of charge.",
      "Worldwide exposure. Zero fees.",
    ],
  },
  hotels: {
    title: "Reach Car Travelers — Free Listings",
    icon: "gift",
    promoLabel: DEFAULT_PROMO_LABEL,
    promoText: DEFAULT_PROMO_TEXT,
    promoHighlight: DEFAULT_PROMO_HIGHLIGHT,
    messages: [
      "Join a community of enthusiasts — No subscription.",
      "Showcase car-friendly hotels — Get discovered for free.",
      "List your hotel — Free of charge.",
      "Worldwide exposure. Zero fees.",
    ],
  },
  others: {
    title: "Post Your Services — Always Free",
    icon: "sparkles",
    promoLabel: DEFAULT_PROMO_LABEL,
    promoText: DEFAULT_PROMO_TEXT,
    promoHighlight: DEFAULT_PROMO_HIGHLIGHT,
    messages: [
      "Posting all services is free.",
      "Reach car enthusiasts — No subscription.",
      "Register your service today at no cost.",
    ],
    ctaHref: "/others/register",
    ctaText: "Register Service",
  },
  clubs: {
    title: "Grow Your Club — Free to Register",
    icon: "sparkles",
    promoLabel: DEFAULT_PROMO_LABEL,
    promoText: DEFAULT_PROMO_TEXT,
    promoHighlight: DEFAULT_PROMO_HIGHLIGHT,
    messages: [
      "Join a community of enthusiasts — No subscription.",
      "Promote your car club — Get members for free.",
      "Register your club or join one — Free of charge.",
      "Worldwide exposure. Zero fees.",
    ],
  },
};

export async function fetchFreeCallout(section: FreeCalloutSection): Promise<FreeCalloutContent> {
  const db = getFirestore(app);
  const docRef = doc(db, CONTENT_DOC_PATH[0], CONTENT_DOC_PATH[1]);
  const snap = await getDoc(docRef);
  const defaults = defaultFreeCallouts[section];
  if (!snap.exists()) return defaults;
  const data = (snap.data() as FreeCalloutDoc) || {};
  const stored = (data?.[section] ?? {}) as Partial<FreeCalloutContent>;
  return {
    title: stored.title ?? defaults.title,
    messages: Array.isArray(stored.messages) && stored.messages.length > 0 ? stored.messages : defaults.messages,
    ctaHref: stored.ctaHref ?? defaults.ctaHref,
    ctaText: stored.ctaText ?? defaults.ctaText,
    icon: stored.icon ?? defaults.icon,
    promoLabel: stored.promoLabel ?? defaults.promoLabel ?? DEFAULT_PROMO_LABEL,
    promoText: stored.promoText ?? defaults.promoText ?? DEFAULT_PROMO_TEXT,
    promoHighlight: stored.promoHighlight ?? defaults.promoHighlight ?? DEFAULT_PROMO_HIGHLIGHT,
  };
}

export async function saveFreeCallout(section: FreeCalloutSection, content: FreeCalloutContent) {
  const db = getFirestore(app);
  const docRef = doc(db, CONTENT_DOC_PATH[0], CONTENT_DOC_PATH[1]);
  await setDoc(docRef, { [section]: content }, { merge: true });
}

export async function fetchAllFreeCallouts(): Promise<Record<FreeCalloutSection, FreeCalloutContent>> {
  const db = getFirestore(app);
  const docRef = doc(db, CONTENT_DOC_PATH[0], CONTENT_DOC_PATH[1]);
  const snap = await getDoc(docRef);
  const data = (snap.exists() ? (snap.data() as FreeCalloutDoc) : {}) || {};
  const result = {} as Record<FreeCalloutSection, FreeCalloutContent>;
  (Object.keys(defaultFreeCallouts) as FreeCalloutSection[]).forEach((key) => {
    const defaults = defaultFreeCallouts[key];
    const stored = (data?.[key] ?? {}) as Partial<FreeCalloutContent>;
    result[key] = {
      title: stored.title ?? defaults.title,
      messages: Array.isArray(stored.messages) && stored.messages.length > 0 ? stored.messages : defaults.messages,
      ctaHref: stored.ctaHref ?? defaults.ctaHref,
      ctaText: stored.ctaText ?? defaults.ctaText,
      icon: stored.icon ?? defaults.icon,
      promoLabel: stored.promoLabel ?? defaults.promoLabel ?? DEFAULT_PROMO_LABEL,
      promoText: stored.promoText ?? defaults.promoText ?? DEFAULT_PROMO_TEXT,
      promoHighlight: stored.promoHighlight ?? defaults.promoHighlight ?? DEFAULT_PROMO_HIGHLIGHT,
    };
  });
  return result;
}

