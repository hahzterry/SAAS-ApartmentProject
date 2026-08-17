"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (address: string) => void;
  error?: string;
}

let optionsInitialized = false;

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function AddressAutocompleteInput({ value, onChange, error }: AddressAutocompleteInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<string | null>(
    MAPS_API_KEY ? null : "Address autocomplete is not configured (missing Google Maps API key).",
  );

  useEffect(() => {
    if (!MAPS_API_KEY || !containerRef.current) return;

    let cancelled = false;
    let element: google.maps.places.PlaceAutocompleteElement | null = null;

    async function init() {
      if (!optionsInitialized) {
        setOptions({ key: MAPS_API_KEY, libraries: ["places"] });
        optionsInitialized = true;
      }

      try {
        const places = await importLibrary("places");
        if (cancelled || !containerRef.current) return;

        element = new places.PlaceAutocompleteElement();
        element.style.width = "100%";
        containerRef.current.replaceChildren(element);

        element.addEventListener("gmp-select", async (event) => {
          const { placePrediction } = event as unknown as {
            placePrediction: { toPlace: () => google.maps.places.Place };
          };
          const place = placePrediction.toPlace();
          await place.fetchFields({ fields: ["formattedAddress"] });
          onChange(place.formattedAddress ?? "");
        });
      } catch {
        if (!cancelled) setLoadError("Failed to load Google Maps address autocomplete.");
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/70 backdrop-blur-md px-4 py-1 shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-berry/50"
      >
        <MapPin className="h-4 w-4 shrink-0 text-berry" />
        <div ref={containerRef} className="w-full min-h-[2.75rem] flex items-center">
          {loadError ? (
            <span className="text-sm text-slate-400">{loadError}</span>
          ) : null}
        </div>
      </div>
      {value ? <p className="mt-1 text-sm text-slate-500">Selected: {value}</p> : null}
      {error ? <p className="mt-1 text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
