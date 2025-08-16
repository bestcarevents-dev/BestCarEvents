import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

export type PageKey =
  | "events"
  | "forum"
  | "auctions"
  | "others"
  | "partners"
  | "cars"
  | "hotels"
  | "clubs";

export interface PageHeader {
  title: string;
  description: string;
}

export const defaultPageContent: Record<PageKey, PageHeader> = {
  events: {
    title: "Discover Events",
    description:
      "From local meetups to international shows, find your next car adventure. Organize, promote, and discover gatherings for every passion—from coffee runs and track days to concours weekends—curated by a global community of enthusiasts.",
  },
  forum: {
    title: "Community Forum",
    description:
      "Connect with fellow car enthusiasts. Share experiences, ask questions, and discuss everything automotive.",
  },
  auctions: {
    title: "Car Auctions",
    description:
      "Find and bid on exclusive collector cars from around the world. Discover live and upcoming auctions, compare lots, and follow your favorite houses—all in one place—curated for serious bidders and passionate enthusiasts alike.",
  },
  others: {
    title: "Other Services",
    description:
      "Discover automotive services including storage, garages, parts, restoration, detailing, and more. Service listings are free.",
  },
  partners: {
    title: "Partners",
    description:
      "Promote your services to a dedicated audience of car enthusiasts. Become a partner and choose your relevant category to reach your target customers.",
  },
  cars: {
    title: "Cars for Sale",
    description:
      "Browse thousands of unique cars curated by enthusiasts and trusted sellers. Refine by make, body style, year, and price to find your perfect match—whether you’re chasing a weekend classic or your next daily driver.",
  },
  hotels: {
    title: "Car Hotels",
    description:
      "Choosing the right hotel can considerably impact your travel experience. By considering factors such as location, price, facilities, reviews, and safety, you can make a decision that meets your needs and preferences. Choose one of our partners.",
  },
  clubs: {
    title: "Car Clubs",
    description:
      "Looking to take your passion for cars further while being in the company of other car lovers and petrolheads. Look no further. Keep reading for the world's most and less popular car clubs. Each car club offers exclusive parties and events, recreational races, and more.",
  },
};

const CONTENT_DOC_PATH = ["site", "pageContent"] as const;

export async function fetchPageHeader(page: PageKey): Promise<PageHeader> {
  const db = getFirestore(app);
  const docRef = doc(db, CONTENT_DOC_PATH[0], CONTENT_DOC_PATH[1]);
  const snap = await getDoc(docRef);
  const defaults = defaultPageContent[page];
  if (!snap.exists()) return defaults;
  const data = snap.data() as Partial<Record<PageKey, Partial<PageHeader>>>;
  const stored = (data?.[page] ?? {}) as Partial<PageHeader>;
  return {
    title: stored.title ?? defaults.title,
    description: stored.description ?? defaults.description,
  };
}

export async function fetchAllPageHeaders(): Promise<Record<PageKey, PageHeader>> {
  const db = getFirestore(app);
  const docRef = doc(db, CONTENT_DOC_PATH[0], CONTENT_DOC_PATH[1]);
  const snap = await getDoc(docRef);
  const data = (snap.exists() ? (snap.data() as any) : {}) as Partial<
    Record<PageKey, Partial<PageHeader>>
  >;
  const result = {} as Record<PageKey, PageHeader>;
  (Object.keys(defaultPageContent) as PageKey[]).forEach((key) => {
    const defaults = defaultPageContent[key];
    const stored = (data?.[key] ?? {}) as Partial<PageHeader>;
    result[key] = {
      title: stored.title ?? defaults.title,
      description: stored.description ?? defaults.description,
    };
  });
  return result;
}

export async function savePageHeader(page: PageKey, header: PageHeader) {
  const db = getFirestore(app);
  const docRef = doc(db, CONTENT_DOC_PATH[0], CONTENT_DOC_PATH[1]);
  await setDoc(docRef, { [page]: header }, { merge: true });
} 