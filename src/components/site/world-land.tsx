import { projectLatLon } from "@/lib/history/geo";
import worldCountries from "@/data/world-countries.json";

type LonLat = [number, number];
type Ring = LonLat[];
type Polygon = Ring[];
type CountryFeature = {
  id?: string;
  properties: { name: string };
  geometry:
    | { type: "Polygon"; coordinates: Polygon }
    | { type: "MultiPolygon"; coordinates: Polygon[] };
};

const COUNTRY_PATHS = (worldCountries.features as unknown as CountryFeature[]).map((feature, index) => ({
  key: `${feature.id ?? feature.properties.name}-${index}`,
  d: geometryPath(feature.geometry),
}));

export function WorldLand() {
  return (
    <g
      fill="rgba(139,92,246,0.26)"
      fillRule="evenodd"
      stroke="rgba(196,181,253,0.42)"
      strokeWidth="0.65"
      strokeLinejoin="round"
    >
      {COUNTRY_PATHS.map((country) => (
        <path key={country.key} d={country.d} />
      ))}
    </g>
  );
}

export function WorldGraticule() {
  const meridians = [];
  for (let lon = -150; lon <= 150; lon += 30) {
    const a = projectLatLon(80, lon);
    const b = projectLatLon(-80, lon);
    meridians.push(<line key={`lon${lon}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />);
  }
  const parallels = [];
  for (let lat = -60; lat <= 60; lat += 30) {
    const a = projectLatLon(lat, -180);
    const b = projectLatLon(lat, 180);
    parallels.push(<line key={`lat${lat}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />);
  }
  return (
    <g stroke="rgba(167,139,250,0.1)" strokeWidth="0.8">
      {meridians}
      {parallels}
    </g>
  );
}

function geometryPath(geometry: CountryFeature["geometry"]) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.flatMap((polygon) => polygon.map(ringPath)).join(" ");
}

function ringPath(ring: Ring) {
  const parts: string[] = [];
  let previousLon: number | null = null;
  for (const [lon, lat] of ring) {
    const { x, y } = projectLatLon(lat, lon);
    const command = previousLon != null && Math.abs(lon - previousLon) > 180 ? "M" : parts.length ? "L" : "M";
    parts.push(`${command} ${x.toFixed(1)} ${y.toFixed(1)}`);
    previousLon = lon;
  }
  if (parts.length) parts.push("Z");
  return parts.join(" ");
}
