export type GeoPoint = {
  lat: number;
  lon: number;
  label: string;
};

const COUNTRY_CENTROID: Record<string, [number, number]> = {
  US: [39.8, -98.6],
  CA: [56.1, -106.3],
  MX: [23.6, -102.5],
  BR: [-14.2, -51.9],
  AR: [-38.4, -63.6],
  CL: [-35.7, -71.5],
  CO: [4.6, -74.3],
  PE: [-9.2, -75.0],
  VE: [6.4, -66.6],
  GB: [55.4, -3.4],
  IE: [53.1, -8.2],
  FR: [46.2, 2.2],
  DE: [51.2, 10.4],
  ES: [40.5, -3.7],
  PT: [39.4, -8.2],
  IT: [41.9, 12.6],
  NL: [52.1, 5.3],
  BE: [50.5, 4.5],
  CH: [46.8, 8.2],
  AT: [47.5, 14.6],
  PL: [51.9, 19.1],
  SE: [60.1, 18.6],
  NO: [60.5, 8.5],
  FI: [61.9, 25.7],
  DK: [56.3, 9.5],
  RO: [45.9, 25.0],
  HU: [47.2, 19.5],
  GR: [39.1, 21.8],
  TR: [39.0, 35.2],
  UA: [48.4, 31.2],
  RU: [61.5, 105.3],
  NG: [9.1, 8.7],
  GH: [7.9, -1.0],
  ZA: [-30.6, 22.9],
  EG: [26.8, 30.8],
  KE: [0.0, 37.9],
  MA: [31.8, -7.1],
  AE: [23.4, 53.8],
  SA: [23.9, 45.1],
  IL: [31.0, 34.8],
  IN: [20.6, 79.0],
  CN: [35.9, 104.2],
  JP: [36.2, 138.3],
  KR: [35.9, 127.8],
  TW: [23.7, 121.0],
  HK: [22.3, 114.2],
  TH: [15.9, 101.0],
  VN: [14.1, 108.3],
  ID: [-0.8, 113.9],
  PH: [12.9, 121.8],
  MY: [4.2, 102.0],
  SG: [1.35, 103.8],
  AU: [-25.3, 133.8],
  NZ: [-40.9, 174.9],
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
  const country = args.country?.trim().toUpperCase();
  if (country && COUNTRY_CENTROID[country]) {
    const [lat, lon] = COUNTRY_CENTROID[country];
    return { lat, lon, label: args.country ?? country };
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
