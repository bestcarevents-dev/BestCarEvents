import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import type { StaticPageKey, StaticPagesDocument, StaticPageContent } from "@/types/staticPages";

const CONTENT_DOC_PATH: [string, string] = ["site_content", "static_pages"];

export const defaultStaticPages: StaticPagesDocument = {
  about: {
    title: "Best Car Events",
    subtitle: "Where passion meets opportunity",
    quote: "A unique community where passion meets opportunity — free for everyone.",
    body:
      "Best Car Events was created because something was missing in the car world: a single place where enthusiasts can share their passion, and those who offer services in this field can all come together.\n\nHere you will find events, auctions, rallies, car sales, clubs, hotels, garages, and more — all collected in one platform, open to everyone. Most importantly, everything is completely free. This is not merchandising, not another commercial project to take advantage of the car industry. Instead, it is a tool made for enthusiasts and automobilists: to connect people, share opportunities, and assist each other in this great automotive world.\n\nWhether you’re at home or traveling, you can use the webpage — and soon the app — to easily find information about what’s happening around you. From international auctions to local rallies, from car hotels to restoration services, Best Car Events is the unique community where passion meets opportunity — free for everyone.",
    images: [],
    contact: {
      email: "info@bestcarevents.com",
      instagram: "https://instagram.com/bestcarevents",
      facebook: "https://facebook.com/bestcarevents",
      twitter: "",
      youtube: "",
      linkedin: "",
      website: "",
      tiktok: "",
      telegram: "",
      whatsapp: "",
    },
    updatedAt: Date.now(),
  },
  contact: {
    title: "Contact Us",
    subtitle: "We'd love to hear from you",
    body: "Send us a message and we'll get back to you shortly.",
    images: [],
    contact: {
      email: "info@bestcarevents.com",
      instagram: "https://instagram.com/bestcarevents",
      facebook: "https://facebook.com/bestcarevents",
      twitter: "",
      youtube: "",
      linkedin: "",
      website: "",
      tiktok: "",
      telegram: "",
      whatsapp: "",
    },
    updatedAt: Date.now(),
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "Privacy Policy for Best Car Events by Custoza",
    body: "1. Introduction\nThis Privacy Policy explains how Best Car Events by Custoza (“we”, “our”, “us”) collects, uses, and protects personal data when you visit or interact with our website www.bestcarevents.com.\nWe are committed to protecting your privacy and handling your personal data responsibly, in accordance with the Swiss Federal Act on Data Protection (FADP).\n\n2. Controller\nThe data controller responsible for the processing of your personal data is:\n\nBest Car Events by Custoza\nVicolo Ponte Vecchio 1\nCH-6988 Ponte Tresa, Switzerland\ninfo@bestcarevents.com\n\n3. Data We Collect\nWe may collect the following categories of personal data when you use our website:\n- Contact information (e.g. name, email address) when you contact us or submit event listings.\n- Technical data such as IP address, browser type, operating system, and website usage statistics.\n- Voluntary information you provide when submitting content, registering, or requesting a service.\n\n4. Purpose of Data Processing\nWe process your data for the following purposes:\n- To operate, maintain, and improve our website and services.\n- To communicate with users, respond to inquiries, and manage listings or promotions.\n- To ensure compliance with legal obligations and website security.\n\n5. Use of Cookies and Analytics\nWe may use cookies and similar technologies to improve your browsing experience and to analyze website usage (for example, via Google Analytics).\nYou can adjust your browser settings to refuse cookies. Some parts of the site may not function properly without them.\n\n6. Disclosure of Data\nWe do not sell, rent, or trade your personal data.\nData may be shared only with trusted technical service providers who support us in hosting, analytics, or maintenance — always under Swiss or equivalent data-protection standards.\n\n7. Data Storage and Security\nYour personal data is stored securely on servers located in Switzerland or the EU. We take appropriate technical and organizational measures to protect your data from unauthorized access, loss, or misuse.\n\n8. Your Rights\nUnder Swiss law, you have the right to:\n- Request access to your personal data;\n- Request correction or deletion of inaccurate or outdated data;\n- Withdraw consent for data processing at any time.\n\nTo exercise these rights, please contact us at info@bestcarevents.com.\n\n9. Retention Period\nWe store personal data only as long as necessary for the purposes stated or as required by law.\n\n10. Changes to This Policy\nWe may update this Privacy Policy from time to time. The latest version will always be published on our website with the date of last update.\n\nLast updated: October 2025",
    images: [],
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
    privacy: { ...defaultStaticPages.privacy, ...(data?.privacy ?? {}) },
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


