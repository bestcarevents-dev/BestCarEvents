"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export type LocationData = {
  formattedAddress: string;
  placeId?: string;
  latitude: number;
  longitude: number;
  components?: Partial<{
    streetNumber: string;
    route: string;
    locality: string; // city
    administrativeAreaLevel1: string; // state/province
    country: string;
    postalCode: string;
  }>;
};

type LocationPickerProps = {
  label?: string;
  placeholder?: string;
  required?: boolean;
  initialValue?: LocationData | null;
  onChange: (value: LocationData | null) => void;
  height?: number;
};

// Lazy load Google Maps JS API
function useGoogleMaps(): boolean {
  const [loaded, setLoaded] = useState<boolean>(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).google?.maps) {
      // Ensure modern library import is performed when available
      const maybeImport = async () => {
        if ((google.maps as any).importLibrary) {
          await Promise.all([
            (google.maps as any).importLibrary("maps"),
            (google.maps as any).importLibrary("places"),
            (google.maps as any).importLibrary("routes").catch(() => null),
          ]);
        }
        setLoaded(true);
      };
      maybeImport();
      return;
    }
    const existing = document.getElementById("google-maps-script");
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set");
      return;
    }
    if (existing) {
      existing.addEventListener("load", async () => {
        if ((window as any).google?.maps && (google.maps as any).importLibrary) {
          await Promise.all([
            (google.maps as any).importLibrary("maps"),
            (google.maps as any).importLibrary("places"),
            (google.maps as any).importLibrary("routes").catch(() => null),
          ]);
        }
        setLoaded(true);
      });
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.async = true;
    script.defer = true;
    // Use v=weekly for modern API; use importLibrary to load Places (New)
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
    script.onload = async () => {
      if ((window as any).google?.maps && (google.maps as any).importLibrary) {
        await Promise.all([
          (google.maps as any).importLibrary("maps"),
          (google.maps as any).importLibrary("places"),
          (google.maps as any).importLibrary("routes").catch(() => null),
        ]);
      }
      setLoaded(true);
    };
    document.head.appendChild(script);
  }, []);
  return loaded;
}

export default function LocationPicker({ label = "Location", placeholder = "Search address or place", required = false, initialValue, onChange, height = 220 }: LocationPickerProps) {
  const loaded = useGoogleMaps();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const [textValue, setTextValue] = useState<string>(initialValue?.formattedAddress || "");
  const [suggestions, setSuggestions] = useState<Array<{ placeId: string; text: string }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionToken] = useState<string>(() => crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()));

  // Initialize map and autocomplete
  useEffect(() => {
    if (!loaded) return;
    if (!mapRef.current) return;

    geocoderRef.current = new google.maps.Geocoder();
    const center = initialValue
      ? { lat: initialValue.latitude, lng: initialValue.longitude }
      : { lat: 46.8182, lng: 8.2275 }; // Switzerland center default

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom: initialValue ? 13 : 6,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    markerRef.current = new google.maps.Marker({
      position: center,
      map: mapInstanceRef.current,
      draggable: true,
    });

    // Drag marker reverse-geocode
    markerRef.current.addListener("dragend", () => {
      const pos = markerRef.current!.getPosition();
      if (!pos) return;
      reverseGeocode(pos.lat(), pos.lng());
    });

    // Click map to move marker and reverse-geocode
    mapInstanceRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      markerRef.current!.setPosition(e.latLng);
      reverseGeocode(e.latLng.lat(), e.latLng.lng());
    });

    // Initialize with initial value
    if (initialValue) {
      onChange(initialValue);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          updateMap(latitude, longitude);
          reverseGeocode(latitude, longitude, false);
        },
        () => {
          // ignore errors; keep default center
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  function updateMap(lat: number, lng: number) {
    if (!mapInstanceRef.current || !markerRef.current) return;
    const pos = new google.maps.LatLng(lat, lng);
    markerRef.current.setPosition(pos);
    mapInstanceRef.current.setCenter(pos);
    mapInstanceRef.current.setZoom(14);
  }

  function buildLocationData(formatted: string, placeId: string | undefined, lat: number, lng: number, addressComponents?: google.maps.GeocoderAddressComponent[]): LocationData {
    const comp: LocationData["components"] = {};
    (addressComponents || []).forEach((c) => {
      if (c.types.includes("street_number")) comp.streetNumber = c.long_name;
      if (c.types.includes("route")) comp.route = c.long_name;
      if (c.types.includes("locality")) comp.locality = c.long_name;
      if (c.types.includes("administrative_area_level_1")) comp.administrativeAreaLevel1 = c.long_name;
      if (c.types.includes("country")) comp.country = c.long_name;
      if (c.types.includes("postal_code")) comp.postalCode = c.long_name;
    });
    return {
      formattedAddress: formatted,
      placeId,
      latitude: lat,
      longitude: lng,
      components: comp,
    };
  }

  function reverseGeocode(lat: number, lng: number, emit = true) {
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const r = results[0];
        const formatted = r.formatted_address;
        setTextValue(formatted);
        const loc = buildLocationData(formatted, r.place_id, lat, lng, r.address_components);
        if (emit) onChange(loc);
      }
    });
  }

  async function fetchAutocomplete(query: string) {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
          "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text",
        },
        body: JSON.stringify({
          input: query,
          languageCode: "en",
          sessionToken,
        }),
      });
      const data = await res.json();
      const list: Array<{ placeId: string; text: string }> = (data?.suggestions || [])
        .map((s: any) => ({ placeId: s?.placePrediction?.placeId, text: s?.placePrediction?.text?.text || "" }))
        .filter((s: any) => s.placeId && s.text);
      setSuggestions(list);
    } catch (e) {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchPlaceDetails(placeId: string) {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        "X-Goog-FieldMask": "id,displayName,formattedAddress,location,addressComponents",
      },
    });
    if (!res.ok) return null;
    return res.json();
  }

  async function handleSelectSuggestion(s: { placeId: string; text: string }) {
    setTextValue(s.text);
    setSuggestions([]);
    const details = await fetchPlaceDetails(s.placeId);
    const lat = details?.location?.latitude;
    const lng = details?.location?.longitude;
    if (typeof lat === "number" && typeof lng === "number") {
      updateMap(lat, lng);
      const comps = (details?.addressComponents || []).map((c: any) => ({
        long_name: c.longText,
        short_name: c.shortText,
        types: [c.types?.[0]].filter(Boolean),
      }));
      onChange(buildLocationData(details?.formattedAddress || s.text, details?.id, lat, lng, comps as any));
    }
  }

  return (
    <div className="space-y-2 w-full">
      {label && (
        <Label className="text-gray-700 font-medium">
          {label} {required ? "*" : ""}
        </Label>
      )}
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={textValue}
          onChange={(e) => {
            setTextValue(e.target.value);
            fetchAutocomplete(e.target.value);
          }}
          className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400 w-full"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded shadow text-gray-900">
            {suggestions.map((s) => (
              <button
                key={s.placeId}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-900"
                onClick={() => handleSelectSuggestion(s)}
              >
                {s.text}
              </button>
            ))}
          </div>
        )}
      </div>
      <Card className="overflow-hidden">
        <div ref={mapRef} style={{ width: "100%", height }} />
      </Card>
    </div>
  );
}


