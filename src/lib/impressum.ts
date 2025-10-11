import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import type { ImpressumDoc } from "@/types/impressum";

const DOC_PATH: [string, string] = ["site_content", "impressum"];

export const defaultImpressum: ImpressumDoc = {
  title: "Impressum / Legal Notice",
  subtitle: "Company legal information",
  sections: [
    {
      id: "company",
      title: "Company",
      content: [
        "Best Car Events by Custoza",
        "Vicolo Ponte Vecchio 1",
        "CH-6988 Ponte Tresa",
        "Switzerland",
      ].join("\n"),
    },
    {
      id: "contact",
      title: "Contact",
      content: [
        "Email: info@bestcarevents.com",
        "Website: www.bestcarevents.com",
      ].join("\n"),
    },
    {
      id: "responsible",
      title: "Responsible for content",
      content:
        "Responsible for content (according to Art. 3 (1) lit. s UCA / Swiss Law):\nFilippo Pignatti Morano di Custoza",
    },
    {
      id: "about",
      title: "About Best Car Events by Custoza",
      content:
        "Best Car Events by Custoza is an independent platform based in Switzerland, dedicated to promoting car events, auctions, clubs, hotels, and related automotive lifestyle services.",
    },
    {
      id: "disclaimer",
      title: "Disclaimer",
      content:
        "All information provided on this website has been carefully checked. However, no guarantee can be given for the completeness, accuracy, or timeliness of the content. The operator reserves the right to make changes or additions at any time.",
    },
    {
      id: "legal",
      title: "Legal",
      content:
        "Legal form: Independent individual registered in Switzerland\nPlace of jurisdiction: Lugano, Switzerland",
    },
  ],
  updatedAt: Date.now(),
};

export async function fetchImpressum(): Promise<ImpressumDoc> {
  const db = getFirestore(app);
  const ref = doc(db, DOC_PATH[0], DOC_PATH[1]);
  const snap = await getDoc(ref);
  if (!snap.exists()) return defaultImpressum;
  const data = snap.data() as Partial<ImpressumDoc>;
  return { ...defaultImpressum, ...(data ?? {}), sections: data?.sections ?? defaultImpressum.sections };
}

export async function saveImpressum(docIn: ImpressumDoc): Promise<void> {
  const db = getFirestore(app);
  const ref = doc(db, DOC_PATH[0], DOC_PATH[1]);
  await setDoc(
    ref,
    {
      ...docIn,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}


