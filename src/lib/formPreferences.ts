import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

// Types for preferences per section
export type CarPreferences = {
  makes?: string[];
  bodyStyles?: string[];
  transmissions?: string[];
  drivetrains?: string[];
  features?: string[];
  currencies?: string[];
};

export type EventPreferences = {
  eventTypes?: string[];
  vehicleFocuses?: string[];
};

export type HotelPreferences = {
  storageTypes?: string[];
  features?: string[];
};

export type ServiceTypeOption = { value: string; label: string; description?: string };
export type ServicePreferences = {
  serviceTypes?: ServiceTypeOption[];
};

export type AuctionPreferences = {
  auctionTypes?: string[];
};

export type SharedPreferences = {
  citiesWhitelist?: string[];
  countriesWhitelist?: string[];
};

export type PreferencesSection =
  | { section: "cars"; data: CarPreferences }
  | { section: "events"; data: EventPreferences }
  | { section: "hotels"; data: HotelPreferences }
  | { section: "services"; data: ServicePreferences }
  | { section: "auctions"; data: AuctionPreferences }
  | { section: "shared"; data: SharedPreferences };

// Defaults derived from existing hardcoded usages
export const DEFAULT_CAR_PREFERENCES: CarPreferences = {
  bodyStyles: [
    "Sedan",
    "SUV",
    "Coupe",
    "Convertible",
    "Hatchback",
    "Wagon",
    "Truck",
    "Van",
  ],
  transmissions: ["Automatic", "Manual"],
  drivetrains: ["FWD", "RWD", "AWD", "4WD"],
  features: [
    "Air Conditioning",
    "Power Steering",
    "Power Windows",
    "Sunroof/Moonroof",
    "Navigation System",
    "Bluetooth",
    "Backup Camera",
    "Leather Seats",
    "Heated Seats",
  ],
  currencies: ["USD", "EUR", "CHF", "GBP", "CAD", "AUD", "JPY", "CNY", "INR", "AED"],
};

export const DEFAULT_EVENT_PREFERENCES: EventPreferences = {
  eventTypes: ["Car Show", "Race", "Meetup", "Rally", "Other"],
  vehicleFocuses: ["Classic", "Sports", "Luxury", "Muscle", "Exotic", "JDM", "European"],
};

export const DEFAULT_HOTEL_PREFERENCES: HotelPreferences = {
  storageTypes: ["Dedicated", "Collection", "Long-Term", "Short-Term"],
  features: [
    "Climate Controlled",
    "24/7 Security",
    "Detailing Services",
    "Member's Lounge",
    "Battery Tending",
    "Transportation",
    "24/7 Access",
    "Social Events",
    "Sales & Brokerage",
  ],
};

export const DEFAULT_SERVICE_PREFERENCES: ServicePreferences = {
  serviceTypes: [
    { value: "car-storage", label: "Car Storage", description: "Secure storage facilities for vehicles" },
    { value: "garage", label: "Garage Services", description: "Mechanical and repair services" },
    { value: "spare-parts", label: "Spare Parts", description: "New and used automotive parts" },
    { value: "restoration", label: "Restoration", description: "Classic car restoration services" },
    { value: "detailing", label: "Detailing", description: "Car cleaning and detailing services" },
    { value: "wrapping", label: "Wrapping & Vinyl", description: "Vehicle wrapping and vinyl services" },
    { value: "towing", label: "Towing Services", description: "Vehicle towing and recovery" },
    { value: "transport", label: "Transport", description: "Vehicle transport and shipping" },
    { value: "insurance", label: "Insurance", description: "Automotive insurance services" },
    { value: "finance", label: "Finance", description: "Vehicle financing and leasing" },
    { value: "consulting", label: "Consulting", description: "Automotive consulting services" },
    { value: "other", label: "Other", description: "Other automotive services" },
  ],
};

export const DEFAULT_AUCTION_PREFERENCES: AuctionPreferences = {
  auctionTypes: ["Online", "In-Person", "Hybrid"],
};

export const DEFAULT_SHARED_PREFERENCES: SharedPreferences = {
  citiesWhitelist: [],
  countriesWhitelist: [],
};

export async function getPreferences<T>(section: PreferencesSection["section"]): Promise<T> {
  const db = getFirestore(app);
  const ref = doc(db, "formPreferences", section);
  const snap = await getDoc(ref);
  const data = (snap.exists() ? (snap.data() as T) : ({} as T));
  return (mergeWithDefaults(section, data) as unknown) as T;
}

export async function savePreferences<T>(section: PreferencesSection["section"], data: T): Promise<void> {
  const db = getFirestore(app);
  const ref = doc(db, "formPreferences", section);
  await setDoc(ref, data as Record<string, unknown>, { merge: false });
}

export async function seedDefaults(): Promise<void> {
  const db = getFirestore(app);
  const sets: Array<{ section: PreferencesSection["section"]; data: any }> = [
    { section: "cars", data: DEFAULT_CAR_PREFERENCES },
    { section: "events", data: DEFAULT_EVENT_PREFERENCES },
    { section: "hotels", data: DEFAULT_HOTEL_PREFERENCES },
    { section: "services", data: DEFAULT_SERVICE_PREFERENCES },
    { section: "auctions", data: DEFAULT_AUCTION_PREFERENCES },
    { section: "shared", data: DEFAULT_SHARED_PREFERENCES },
  ];
  await Promise.all(
    sets.map(({ section, data }) => setDoc(doc(db, "formPreferences", section), data, { merge: true }))
  );
}

function mergeWithDefaults(section: PreferencesSection["section"], data: any): any {
  switch (section) {
    case "cars":
      return { ...DEFAULT_CAR_PREFERENCES, ...(data || {}) } as CarPreferences;
    case "events":
      return { ...DEFAULT_EVENT_PREFERENCES, ...(data || {}) } as EventPreferences;
    case "hotels":
      return { ...DEFAULT_HOTEL_PREFERENCES, ...(data || {}) } as HotelPreferences;
    case "services":
      return { ...DEFAULT_SERVICE_PREFERENCES, ...(data || {}) } as ServicePreferences;
    case "auctions":
      return { ...DEFAULT_AUCTION_PREFERENCES, ...(data || {}) } as AuctionPreferences;
    case "shared":
      return { ...DEFAULT_SHARED_PREFERENCES, ...(data || {}) } as SharedPreferences;
    default:
      return data || {};
  }
}


