"use client";

import { useEffect, useState } from "react";
import {
  getPreferences,
  type CarPreferences,
  type EventPreferences,
  type HotelPreferences,
  type ServicePreferences,
  type AuctionPreferences,
  type SharedPreferences,
} from "@/lib/formPreferences";

export type PreferenceSection = "cars" | "events" | "hotels" | "services" | "auctions" | "shared";

type SectionMap = {
  cars: CarPreferences;
  events: EventPreferences;
  hotels: HotelPreferences;
  services: ServicePreferences;
  auctions: AuctionPreferences;
  shared: SharedPreferences;
};

export function useFormPreferences<S extends PreferenceSection>(section: S) {
  const [data, setData] = useState<SectionMap[S] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        // @ts-expect-error generic narrowing at runtime
        const prefs = await getPreferences<SectionMap[S]>(section);
        if (isMounted) setData(prefs);
      } catch (e: any) {
        if (isMounted) setError(e?.message || "Failed to load preferences");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [section]);

  return { data, loading, error } as const;
}


