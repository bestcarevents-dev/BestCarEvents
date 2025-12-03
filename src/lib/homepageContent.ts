import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import type { HomepageContent } from "@/types/homepage";

// Defaults mirroring current hardcoded copy
export const defaultHomepageContent: HomepageContent = {
  hero: {
    slides: [
      {
        headline: "Discover Premium Car Events",
        subheadline: "Connect with automotive excellence worldwide",
        image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop",
        hint: "dark sports car",
      },
      {
        headline: "Find Your Next Masterpiece",
        subheadline: "Our curated marketplace features thousands of unique vehicles",
        image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070&auto=format&fit=crop",
        hint: "vintage car show",
      },
      {
        headline: "Join a Community of Enthusiasts",
        subheadline: "Attend exclusive meetups, track days, and auctions.",
        image: "https://plus.unsplash.com/premium_photo-1664303847960-586318f59035?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        hint: "car community meetup",
      },
    ],
  },
  promo: {
    badgeText: "ZERO COST LISTINGS",
    mainHeading: "ALL LISTINGS ARE FREE",
    chips: ["🏨 Hotels", "👥 Clubs", "🎪 Events", "🔨 Auctions", "🛠️ Services"],
    carsLinePrefix: "Cars:",
    carsLineHighlight: "Free until 31st December 2025",
    ctaLabel: "Post a Listing",
    ctaHref: "/post-a-listing",
  },
  value: {
    heading: "Join Our Global Car Community",
    description:
      "Connect with passionate car enthusiasts, collectors, and professionals. Share experiences, discover events, and be part of something extraordinary.",
    items: [
      {
        title: "Verified Members",
        description:
          "Connect with trusted enthusiasts and professionals in the automotive world.",
      },
      {
        title: "Exclusive Access",
        description:
          "Get early access to premium events, rare car listings, and special offers.",
      },
      {
        title: "Growing Network",
        description:
          "Join thousands of car enthusiasts sharing their passion and expertise daily.",
      },
    ],
  },
  featuredCars: {
    title: "Featured Cars",
    description: "Explore a selection of exceptional vehicles. Car listings are free until 31st December 2025.",
    ctaLabel: "View Marketplace",
    ctaHref: "/cars",
  },
  featuredEvents: {
    title: "Upcoming Events",
    description:
      "Discover the most exclusive automotive gatherings around the world. Event listings are free.",
    ctaLabel: "View All Events",
    ctaHref: "/events",
  },
  featuredAuctions: {
    title: "Live Auctions",
    description: "Bid on rare and exclusive vehicles. Auction listings are free to post.",
    ctaLabel: "View All Auctions",
    ctaHref: "/auctions",
  },
  featuredHotels: {
    title: "Featured Hotels",
    description:
      "Discover premium car hotels and storage facilities for your valuable vehicles. Hotel listings are free.",
    ctaLabel: "View All Hotels",
    ctaHref: "/hotels",
  },
  featuredClubs: {
    title: "Featured Clubs",
    description:
      "Join exclusive car clubs and connect with fellow enthusiasts. Club listings are free.",
    ctaLabel: "View All Clubs",
    ctaHref: "/clubs",
  },
  featuredServices: {
    title: "Other Services",
    description:
      "Discover automotive services including storage, garages, parts, restoration, detailing, and more. Service listings are free.",
    ctaLabel: "View All Services",
    ctaHref: "/others",
  },
  video: {
    title: "Best Car Events",
    text: "Discover the best car events worldwide — free listings for cars, auctions, clubs, hotels, services.",
  },
  galleries: {
    main: { title: "Community Gallery", layout: 'random' },
    location1: { title: "Location Spotlight: 1", layout: 'random' },
    location2: { title: "Location Spotlight: 2", layout: 'random' },
  },
};

const CONTENT_DOC_PATH = ["site", "homepage"] as const;

type ContentPath = typeof CONTENT_DOC_PATH;

export async function fetchHomepageContent(): Promise<HomepageContent> {
  const db = getFirestore(app);
  const docRef = doc(db, CONTENT_DOC_PATH[0], CONTENT_DOC_PATH[1]);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return defaultHomepageContent;
  const data = snap.data() as HomepageContent;
  return {
    ...defaultHomepageContent,
    ...data,
    hero: {
      slides: data?.hero?.slides?.length ? data.hero.slides : defaultHomepageContent.hero!.slides,
    },
    galleries: {
      main: { title: data?.galleries?.main?.title ?? defaultHomepageContent.galleries!.main!.title, layout: data?.galleries?.main?.layout ?? 'random' },
      location1: { title: data?.galleries?.location1?.title ?? defaultHomepageContent.galleries!.location1!.title, layout: data?.galleries?.location1?.layout ?? 'random' },
      location2: { title: data?.galleries?.location2?.title ?? defaultHomepageContent.galleries!.location2!.title, layout: data?.galleries?.location2?.layout ?? 'random' },
    }
  };
}

export async function saveHomepageSection<K extends keyof HomepageContent>(
  key: K,
  value: HomepageContent[K]
) {
  const db = getFirestore(app);
  const docRef = doc(db, CONTENT_DOC_PATH[0], CONTENT_DOC_PATH[1]);
  await setDoc(docRef, { [key]: value }, { merge: true });
} 