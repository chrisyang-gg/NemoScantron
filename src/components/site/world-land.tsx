import { projectLatLon } from "@/lib/history/geo";

function land(points: [number, number][]) {
  return (
    points
      .map(([lat, lon], index) => {
        const { x, y } = projectLatLon(lat, lon);
        return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ") + " Z"
  );
}

const CONTINENTS: [number, number][][] = [
  // North America
  [
    [71, -162],
    [68, -130],
    [60, -136],
    [55, -130],
    [48, -125],
    [32, -117],
    [23, -110],
    [26, -97],
    [29, -90],
    [25, -81],
    [31, -81],
    [45, -67],
    [47, -53],
    [53, -56],
    [60, -64],
    [70, -80],
    [73, -95],
    [70, -140],
    [71, -162],
  ],
  // South America
  [
    [12, -72],
    [10, -62],
    [5, -51],
    [-6, -35],
    [-23, -42],
    [-34, -53],
    [-55, -68],
    [-45, -74],
    [-18, -71],
    [0, -80],
    [8, -79],
    [12, -72],
  ],
  // Europe
  [
    [71, 25],
    [70, 8],
    [58, 5],
    [51, -10],
    [43, -9],
    [36, -6],
    [38, 15],
    [41, 29],
    [46, 35],
    [60, 30],
    [71, 25],
  ],
  // Africa
  [
    [37, -6],
    [37, 10],
    [32, 32],
    [12, 51],
    [-5, 40],
    [-35, 28],
    [-34, 18],
    [-18, 12],
    [5, 8],
    [5, -8],
    [15, -17],
    [32, -10],
    [37, -6],
  ],
  // Asia
  [
    [73, 60],
    [66, 40],
    [55, 36],
    [42, 27],
    [36, 36],
    [28, 48],
    [25, 56],
    [22, 59],
    [8, 77],
    [8, 98],
    [20, 110],
    [22, 122],
    [40, 128],
    [53, 142],
    [66, 180],
    [72, 140],
    [75, 100],
    [73, 60],
  ],
  // Australia
  [
    [-11, 142],
    [-12, 130],
    [-22, 114],
    [-35, 115],
    [-39, 140],
    [-28, 153],
    [-11, 142],
  ],
  // UK
  [
    [59, -6],
    [50, -5],
    [51, 1.5],
    [58, -2],
    [59, -6],
  ],
  // Japan
  [
    [45, 141],
    [35, 139],
    [31, 131],
    [34, 133],
    [43, 145],
    [45, 141],
  ],
];

export function WorldLand() {
  return (
    <g fill="rgba(139,92,246,0.24)" stroke="rgba(196,181,253,0.35)" strokeWidth="1.1">
      {CONTINENTS.map((points, index) => (
        <path key={index} d={land(points)} />
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
