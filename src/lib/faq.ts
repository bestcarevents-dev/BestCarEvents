import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

export type FaqItem = {
  id?: string;
  question: string;
  answer: string;
  tags?: string[];
  order?: number;
  updatedAt?: number;
  createdAt?: number;
};

const COLLECTION = "faqs";
const SETTINGS_DOC = ["site_content", "faq_settings"] as const;

export const defaultFaqs: FaqItem[] = [
  {
    question: "What is Best Car Events?",
    answer:
      "Best Car Events is a global calendar for collectible car culture — from concours and rallies to auctions, club meets and lifestyle gatherings — connecting enthusiasts, organizers, hotels and partners worldwide.",
    order: 1,
  },
  {
    question: "Can I promote my event for free?",
    answer:
      "Yes. Create an account and submit your event details. We review basic info for clarity and then publish. Free listings help keep the community vibrant.",
    tags: ["Free"],
    order: 2,
  },
  {
    question: "How do premium banners and featured partners work?",
    answer:
      "We reserve a limited number of paid banner slots on the homepage and at the top of each category (Hotels, Auctions, Clubs, Car Sales). Spots rotate fairly and are sold monthly or quarterly.",
    tags: ["Premium"],
    order: 3,
  },
  {
    question: "Can I list my car for sale?",
    answer:
      "Yes. You can post classic and collectible cars for sale. Introductory periods may include free listings; afterward, choose a light subscription or pay‑per‑listing option.",
    order: 4,
  },
  {
    question: "How do I edit or remove an event?",
    answer:
      "Log in and open My Events in your dashboard to update details, change dates or unpublish at any time.",
    order: 5,
  },
  {
    question: "Is the site available in multiple languages?",
    answer:
      "Yes. Use the language flags in the top‑right to switch instantly. We’re expanding translations as the community grows.",
    tags: ["Multi-language"],
    order: 6,
  },
  {
    question: "How can I contact the team?",
    answer:
      "For general help use the Contact form or email info@bestcarevents.com. Partnerships & media: partners@bestcarevents.com.",
    order: 7,
  },
];

export async function fetchFaqs(): Promise<FaqItem[]> {
  const db = getFirestore(app);
  const snap = await getDocs(collection(db, COLLECTION));
  if (snap.empty) return defaultFaqs.map((it, idx) => ({ ...it, id: `default-${idx}` }));
  const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FaqItem[];
  return items
    .map((it, i) => ({ ...it, order: it.order ?? i }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function addFaq(item: Omit<FaqItem, "id" | "updatedAt" | "createdAt">) {
  const db = getFirestore(app);
  const now = Date.now();
  return await addDoc(collection(db, COLLECTION), { ...item, createdAt: now, updatedAt: now });
}

export async function updateFaq(id: string, updates: Partial<Omit<FaqItem, "id" | "createdAt">>) {
  const db = getFirestore(app);
  await updateDoc(doc(db, COLLECTION, id), { ...updates, updatedAt: Date.now() });
}

export async function deleteFaq(id: string) {
  const db = getFirestore(app);
  await deleteDoc(doc(db, COLLECTION, id));
}

// Optional settings (e.g., page title/intro); fallback-driven
export type FaqSettings = {
  title?: string;
  intro?: string;
};

export const defaultFaqSettings: FaqSettings = {
  title: "Frequently Asked Questions",
  intro:
    "Answers to the most common questions about listings, premium banners, languages and support on BestCarEvents.com.",
};

export async function fetchFaqSettings(): Promise<FaqSettings> {
  const db = getFirestore(app);
  const ref = doc(db, SETTINGS_DOC[0], SETTINGS_DOC[1]);
  const snap = await getDoc(ref);
  if (!snap.exists()) return defaultFaqSettings;
  const data = snap.data() as Partial<FaqSettings>;
  return { ...defaultFaqSettings, ...data };
}

export async function saveFaqSettings(settings: FaqSettings) {
  const db = getFirestore(app);
  const ref = doc(db, SETTINGS_DOC[0], SETTINGS_DOC[1]);
  await setDoc(ref, settings, { merge: true });
}


