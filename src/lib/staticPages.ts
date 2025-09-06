import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import type { StaticPageKey, StaticPagesDocument, StaticPageContent } from "@/types/staticPages";

const CONTENT_DOC_PATH: [string, string] = ["site_content", "static_pages"];

export const defaultStaticPages: StaticPagesDocument = {
  about: {
    title: "Best Car Events",
    subtitle: "Where passion meets opportunity",
    body:
      "Best Car Events was created because something was missing in the car world: a single place where enthusiasts can share their passion, and those who offer services in this field can all come together.\n\nHere you will find events, auctions, rallies, car sales, clubs, hotels, garages, and more — all collected in one platform, open to everyone. Most importantly, everything is completely free. This is not merchandising, not another commercial project to take advantage of the car industry. Instead, it is a tool made for enthusiasts and automobilists: to connect people, share opportunities, and assist each other in this great automotive world.\n\nWhether you’re at home or traveling, you can use the webpage — and soon the app — to easily find information about what’s happening around you. From international auctions to local rallies, from car hotels to restoration services, Best Car Events is the unique community where passion meets opportunity — free for everyone.",
    images: [],
    updatedAt: Date.now(),
  },
  contact: {
    title: "Contact Us",
    subtitle: "We'd love to hear from you",
    body: "Send us a message and we'll get back to you shortly.",
    images: [],
    contact: {
      email: "hello@bestcarevents.com",
      instagram: "https://instagram.com/bestcarevents",
    },
    updatedAt: Date.now(),
  },
};

export async function fetchStaticPage(key: StaticPageKey): Promise<StaticPageContent> {
  const db = getFirestore(app);
  const ref = doc(db, CONTENT_DOC_PATH[0], CONTENT_DOC_PATH[1]);
  const snap = await getDoc(ref);
  if (!snap.exists()) return defaultStaticPages[key];
  const data = snap.data() as Partial<StaticPagesDocument>;
  return { ...defaultStaticPages[key], ...(data?.[key] ?? {}) } as StaticPageContent;
}

export async function fetchAllStaticPages(): Promise<StaticPagesDocument> {
  const db = getFirestore(app);
  const ref = doc(db, CONTENT_DOC_PATH[0], CONTENT_DOC_PATH[1]);
  const snap = await getDoc(ref);
  if (!snap.exists()) return defaultStaticPages;
  const data = snap.data() as Partial<StaticPagesDocument>;
  return {
    about: { ...defaultStaticPages.about, ...(data?.about ?? {}) },
    contact: { ...defaultStaticPages.contact, ...(data?.contact ?? {}) },
  };
}

export async function saveStaticPage(key: StaticPageKey, content: StaticPageContent) {
  const db = getFirestore(app);
  const ref = doc(db, CONTENT_DOC_PATH[0], CONTENT_DOC_PATH[1]);
  await setDoc(
    ref,
    {
      [key]: {
        ...content,
        updatedAt: Date.now(),
      },
    },
    { merge: true }
  );
}


