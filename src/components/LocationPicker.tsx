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
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [textValue, setTextValue] = useState<string>(initialValue?.formattedAddress || "");

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

    // Autocomplete setup
    if (inputRef.current) {
      const options: google.maps.places.AutocompleteOptions = {
        fields: ["place_id", "geometry", "formatted_address", "address_components", "name"],
        types: ["geocode"],
      };
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, options);
      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current!.getPlace();
        if (!place || !place.geometry || !place.geometry.location) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const formatted = place.formatted_address || place.name || "";
        setTextValue(formatted);
        updateMap(lat, lng);
        onChange(buildLocationData(formatted, place.place_id, lat, lng, place.address_components));
      });
    }

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

  return (
    <div className="space-y-2 w-full">
      {label && (
        <Label className="text-gray-700 font-medium">
          {label} {required ? "*" : ""}
        </Label>
      )}
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400 w-full"
      />
      <Card className="overflow-hidden">
        <div ref={mapRef} style={{ width: "100%", height }} />
      </Card>
    </div>
  );
}


