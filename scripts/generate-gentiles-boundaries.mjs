import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================
// HELPERS
// ============================================================
function tr(ring) {
  return ring.map(([a, b]) => [Math.round(a * 1e4) / 1e4, Math.round(b * 1e4) / 1e4]);
}
function centroid(ring) {
  const n = ring.length - 1;
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += ring[i][0]; sy += ring[i][1]; }
  return [Math.round(sx / n * 1e4) / 1e4, Math.round(sy / n * 1e4) / 1e4];
}
function feat(props, ring) {
  ring.push(ring[0]);
  const t = tr(ring);
  return { type: 'Feature', properties: { ...props, labelCoords: centroid(t) },
    geometry: { type: 'Polygon', coordinates: [t] } };
}

// Mediterranean coast S → N
const COAST = [
  [33.81,31.08],[33.90,31.10],[34.00,31.14],[34.10,31.18],[34.17,31.22],
  [34.22,31.27],[34.27,31.32],[34.32,31.38],[34.36,31.42],[34.40,31.47],
  [34.43,31.52],[34.46,31.58],[34.49,31.62],[34.52,31.66],[34.55,31.71],
  [34.58,31.76],[34.61,31.80],[34.63,31.84],[34.66,31.88],[34.68,31.92],
  [34.70,31.96],[34.74,32.02],[34.76,32.05],[34.78,32.10],[34.79,32.15],
  [34.81,32.20],[34.83,32.25],[34.85,32.30],[34.86,32.35],[34.87,32.40],
  [34.88,32.45],[34.89,32.50],[34.89,32.55],[34.88,32.60],[34.87,32.65],
  [34.87,32.70],[34.87,32.75],[34.86,32.79],[34.84,32.82],[34.86,32.83],
  [34.92,32.82],[34.97,32.83],[34.99,32.85],[35.02,32.88],[35.05,32.92],
  [35.07,32.96],[35.08,33.00],[35.10,33.05],[35.10,33.09],[35.12,33.13],
  [35.14,33.17],[35.18,33.22],[35.20,33.27],
];

function interpLat(poly, lat) {
  for (let i = 0; i < poly.length - 1; i++) {
    const [x1, y1] = poly[i], [x2, y2] = poly[i + 1];
    if ((y1 <= lat && y2 >= lat) || (y1 >= lat && y2 <= lat)) {
      if (Math.abs(y2 - y1) < 1e-6) return [x1, lat];
      const t = Math.max(0, Math.min(1, (lat - y1) / (y2 - y1)));
      return [x1 + t * (x2 - x1), lat];
    }
  }
  const d = poly.map(([, y]) => Math.abs(y - lat));
  return [poly[d.indexOf(Math.min(...d))][0], lat];
}
function coastSlice(latS, latN) {
  const r = [interpLat(COAST, latS)];
  for (const p of COAST) if (p[1] > latS + 0.001 && p[1] < latN - 0.001) r.push(p);
  r.push(interpLat(COAST, latN));
  return r;
}

// ============================================================
// LAND OF ISRAEL (under Gentile rule)
// ============================================================
function buildLandOfIsrael() {
  const coast = coastSlice(31.00, 33.27);
  const ring = [
    ...coast,
    [35.30, 33.20],[35.40, 33.15],[35.50, 33.10],
    [35.60, 33.05],[35.65, 33.00],
    [35.63, 32.90],[35.64, 32.82],[35.63, 32.74],
    [35.60, 32.70],[35.58, 32.60],[35.55, 32.50],
    [35.52, 32.40],[35.50, 32.30],[35.50, 32.20],
    [35.49, 32.10],[35.48, 32.00],[35.46, 31.90],
    [35.44, 31.78],
    [35.42, 31.70],[35.39, 31.62],[35.38, 31.54],
    [35.37, 31.46],[35.37, 31.38],[35.38, 31.30],
    [35.39, 31.22],[35.38, 31.14],[35.36, 31.06],
    [35.36, 31.00],
    [35.15, 30.90],[34.80, 30.95],[34.50, 31.00],
  ];
  return feat({ id: 'land-of-israel', name: 'Land of Israel (under Gentile rule)', type: 'region',
    fillColor: '#4A90D9', strokeColor: '#2E5984' }, ring);
}

// ============================================================
// MAIN — Gentiles period: just Land of Israel
// ============================================================
function main() {
  const features = [buildLandOfIsrael()];
  const fc = { type: 'FeatureCollection', features };
  const json = JSON.stringify(fc, null, 2);

  const out = join(__dirname, '..', 'public', 'data', 'boundaries', 'period-gentiles', 'boundaries.geojson');
  writeFileSync(out, json);
  console.log(`Gentiles: ${features.length} feature(s), ${(Buffer.byteLength(json) / 1024).toFixed(1)} KB`);
}

main();
