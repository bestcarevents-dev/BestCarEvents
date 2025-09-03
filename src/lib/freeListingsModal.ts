import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

export interface FreeListingsModalContent {
  headlineTop: string; // e.g., ALL LISTINGS ARE
  headlineEmphasis: string; // e.g., FREE!
  subline?: string; // e.g., Cars: Free for 2 months
  ctaLabel: string; // e.g., START LISTING NOW! 🚀
}

const CONTENT_DOC_PATH = ["site", "freeListingsModal"] as const;

export const defaultFreeListingsModal: FreeListingsModalContent = {
  headlineTop: "ALL LISTINGS ARE",
  headlineEmphasis: "FREE!",
  subline: "Cars: Free for 2 months",
  ctaLabel: "START LISTING NOW! 🚀",
};

export async function fetchFreeListingsModal(): Promise<FreeListingsModalContent> {
  const db = getFirestore(app);
  const docRef = doc(db, CONTENT_DOC_PATH[0], CONTENT_DOC_PATH[1]);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return defaultFreeListingsModal;
  const data = (snap.data() as Partial<FreeListingsModalContent>) || {};
  return {
    headlineTop: data.headlineTop ?? defaultFreeListingsModal.headlineTop,
    headlineEmphasis: data.headlineEmphasis ?? defaultFreeListingsModal.headlineEmphasis,
    subline: data.subline ?? defaultFreeListingsModal.subline,
    ctaLabel: data.ctaLabel ?? defaultFreeListingsModal.ctaLabel,
  };
}

export async function saveFreeListingsModal(content: FreeListingsModalContent) {
  const db = getFirestore(app);
  const docRef = doc(db, CONTENT_DOC_PATH[0], CONTENT_DOC_PATH[1]);
  await setDoc(docRef, content, { merge: true });
}


