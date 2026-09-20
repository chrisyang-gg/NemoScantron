import { COUNTRY_CENTROID } from "@/lib/history/country-centroids";

export type GeoPoint = {
  lat: number;
  lon: number;
  label: string;
};

const CITY_COORDS: Record<string, [number, number]> = {
  "new york": [40.71, -74.01],
  pittsburgh: [40.44, -80.0],
  austin: [30.27, -97.74],
  miami: [25.76, -80.19],
  denver: [39.74, -104.99],
  seattle: [47.61, -122.33],
  chicago: [41.88, -87.63],
  "los angeles": [34.05, -118.24],
  houston: [29.76, -95.37],
  toronto: [43.65, -79.38],
  lagos: [6.52, 3.38],
  tokyo: [35.68, 139.69],
  "são paulo": [-23.55, -46.63],
  "sao paulo": [-23.55, -46.63],
  london: [51.51, -0.13],
  bucharest: [44.43, 26.1],
  amsterdam: [52.37, 4.9],
  paris: [48.86, 2.35],
  berlin: [52.52, 13.41],
  dubai: [25.2, 55.27],
  mumbai: [19.08, 72.88],
  sydney: [-33.87, 151.21],
};

const COUNTRY_LOOKUP: Record<string, [number, number]> = Object.fromEntries(
  Object.entries(COUNTRY_CENTROID).flatMap(([key, value]) => [
    [key, value],
    [key.toUpperCase(), value],
    [key.toLowerCase(), value],
  ]),
);

export function resolvePlace(args: {
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  country?: string | null;
}): GeoPoint | null {
  if (args.latitude != null && args.longitude != null) {
    return {
      lat: args.latitude,
      lon: args.longitude,
      label: [args.city, args.country].filter(Boolean).join(", ") || "coordinates",
    };
  }
  const city = args.city?.trim().toLowerCase();
  if (city && CITY_COORDS[city]) {
    const [lat, lon] = CITY_COORDS[city];
    return { lat, lon, label: [args.city, args.country].filter(Boolean).join(", ") };
  }
  const country = args.country?.trim();
  if (country) {
    const coords = COUNTRY_LOOKUP[country] ?? COUNTRY_LOOKUP[country.toUpperCase()] ?? COUNTRY_LOOKUP[country.toLowerCase()];
    if (coords) {
      const [lat, lon] = coords;
      return { lat, lon, label: args.country ?? country };
    }
  }
  return null;
}

export const MAP = { width: 1000, height: 500, padX: 8, padY: 12 };

export function projectLatLon(lat: number, lon: number): { x: number; y: number } {
  const x = MAP.padX + ((lon + 180) / 360) * (MAP.width - MAP.padX * 2);
  const y = MAP.padY + ((90 - lat) / 180) * (MAP.height - MAP.padY * 2);
  return { x, y };
}

export function samePoint(a: GeoPoint, b: GeoPoint): boolean {
  return Math.abs(a.lat - b.lat) < 0.4 && Math.abs(a.lon - b.lon) < 0.4;
}
