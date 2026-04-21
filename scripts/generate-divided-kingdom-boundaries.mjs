import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================
// REFERENCE: Mediterranean coastline [lon, lat] S → N
// ============================================================
const COAST = [
  [33.81, 31.08],[33.90, 31.10],[34.00, 31.14],[34.10, 31.18],[34.17, 31.22],
  [34.22, 31.27],[34.27, 31.32],[34.32, 31.38],[34.36, 31.42],[34.40, 31.47],
  [34.43, 31.52],[34.46, 31.58],[34.49, 31.62],[34.52, 31.66],[34.55, 31.71],
  [34.58, 31.76],[34.61, 31.80],[34.63, 31.84],[34.66, 31.88],[34.68, 31.92],
  [34.70, 31.96],[34.74, 32.02],[34.76, 32.05],[34.78, 32.10],[34.79, 32.15],
  [34.81, 32.20],[34.83, 32.25],[34.85, 32.30],[34.86, 32.35],[34.87, 32.40],
  [34.88, 32.45],[34.89, 32.50],[34.89, 32.55],[34.88, 32.60],[34.87, 32.65],
  [34.87, 32.70],[34.87, 32.75],[34.86, 32.79],[34.84, 32.82],[34.86, 32.83],
  [34.92, 32.82],[34.97, 32.83],[34.99, 32.85],[35.02, 32.88],[35.05, 32.92],
  [35.07, 32.96],[35.08, 33.00],[35.10, 33.05],[35.10, 33.09],[35.12, 33.13],
  [35.14, 33.17],[35.18, 33.22],[35.20, 33.27],[35.23, 33.32],[35.26, 33.37],
  [35.30, 33.42],[35.33, 33.47],[35.36, 33.53],[35.38, 33.57],[35.40, 33.62],
  [35.42, 33.67],[35.44, 33.72],[35.46, 33.78],[35.48, 33.83],[35.50, 33.88],
  [35.52, 33.92],[35.55, 33.97],[35.57, 34.02],[35.60, 34.07],[35.63, 34.12],
  [35.66, 34.18],[35.70, 34.24],[35.74, 34.30],[35.78, 34.36],[35.82, 34.42],
];

// ============================================================
// HELPERS
// ============================================================
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
  ring.push(ring[0]); // close
  const t = tr(ring);
  return { type: 'Feature', properties: { ...props, labelCoords: centroid(t) }, geometry: { type: 'Polygon', coordinates: [t] } };
}

// ============================================================
// Shared border: Israel / Judah (~31.93°N from coast to Dead Sea)
// Runs W → E from coast through Gezer/Aijalon/Bethel to Dead Sea
// ============================================================
const ISRAEL_JUDAH_BORDER = [
  // starts at coast at 31.93°N, ends at Dead Sea NW
  [34.80, 31.93],
  [34.92, 31.92],
  [35.02, 31.90],
  [35.12, 31.88],
  [35.20, 31.87],
  [35.30, 31.85],
  [35.38, 31.83],
  [35.44, 31.78], // Dead Sea NW corner
];

// ============================================================
// KINGDOM OF JUDAH
// ============================================================
function buildJudah() {
  // Clockwise: coast N → border E → Dead Sea S → Negev W → coast
  const coast = coastSlice(31.25, 31.93);

  const ring = [
    // West coast going north
    ...coast,
    // North: Israel/Judah border going east to Dead Sea
    ...ISRAEL_JUDAH_BORDER,
    // East: Dead Sea western shore going south
    [35.43, 31.74],[35.42, 31.70],[35.40, 31.66],[35.39, 31.62],
    [35.38, 31.58],[35.38, 31.54],[35.37, 31.50],[35.37, 31.46],
    [35.37, 31.42],[35.37, 31.38],[35.37, 31.34],[35.38, 31.30],
    [35.39, 31.26],[35.40, 31.22],[35.39, 31.18],[35.38, 31.14],
    [35.37, 31.10],[35.36, 31.06],[35.36, 31.02],[35.36, 30.98],
    // South: Negev going west back to coast
    [35.30, 30.95],[35.15, 30.85],[35.00, 30.80],
    [34.80, 30.88],[34.60, 31.00],[34.40, 31.10],[34.25, 31.20],
  ];

  return feat({ id: 'kingdom-of-judah', name: 'Kingdom of Judah', type: 'kingdom',
    fillColor: '#4A90D9', strokeColor: '#2E5984' }, ring);
}

// ============================================================
// KINGDOM OF ISRAEL
// ============================================================
function buildIsrael() {
  const coast = coastSlice(31.93, 33.10);

  const ring = [
    // West coast going north (Judah border to Rosh HaNikra)
    ...coast,
    // North: inland from coast to upper Galilee / Dan
    [35.15, 33.08],[35.22, 33.05],[35.30, 33.02],
    [35.38, 33.00],[35.45, 32.98],[35.50, 32.95],
    [35.53, 32.90], // NW Sea of Galilee
    // East: Sea of Galilee western shore going south
    [35.51, 32.86],[35.50, 32.82],[35.50, 32.78],
    [35.51, 32.74],[35.52, 32.70],
    // East: Jordan River western bank going south to Dead Sea
    [35.51, 32.64],[35.51, 32.58],[35.51, 32.50],
    [35.50, 32.42],[35.50, 32.34],[35.50, 32.26],
    [35.49, 32.18],[35.49, 32.10],[35.48, 32.02],
    [35.46, 31.94],[35.45, 31.87],[35.44, 31.82],
    [35.44, 31.78], // Dead Sea NW
    // South: Israel/Judah border going west back to coast
    ...ISRAEL_JUDAH_BORDER.slice().reverse(),
  ];

  return feat({ id: 'kingdom-of-israel', name: 'Kingdom of Israel', type: 'kingdom',
    fillColor: '#5BB85B', strokeColor: '#3A7A3A' }, ring);
}

// ============================================================
// PHILISTIA
// ============================================================
function buildPhilistia() {
  const coast = coastSlice(31.25, 31.88);

  const ring = [
    ...coast,
    // Inland border going south: Ekron → Gath → inland Gaza
    [34.80, 31.88],[34.82, 31.82],[34.78, 31.75],
    [34.72, 31.68],[34.68, 31.60],[34.62, 31.52],
    [34.55, 31.42],[34.45, 31.30],[34.38, 31.25],
  ];

  return feat({ id: 'philistia', name: 'Philistia', type: 'kingdom',
    fillColor: '#E67E22', strokeColor: '#A85C15' }, ring);
}

// ============================================================
// MOAB — east of Dead Sea, between Arnon and Zered
// ============================================================
function buildMoab() {
  const ring = [
    // Start at Arnon entry on Dead Sea, go clockwise
    // North: Arnon gorge going east from Dead Sea
    [35.57, 31.46],[35.65, 31.47],[35.75, 31.48],
    [35.90, 31.50],[36.05, 31.50],
    // East: desert border going south
    [36.18, 31.45],[36.22, 31.35],[36.22, 31.22],
    [36.18, 31.10],[36.10, 31.02],
    // South: Zered going west to Dead Sea
    [36.00, 30.97],[35.85, 30.96],[35.70, 30.96],
    [35.55, 30.97],[35.48, 30.98],
    // West: Dead Sea eastern shore going north (Zered → Arnon)
    [35.48, 31.02],[35.49, 31.06],[35.50, 31.10],
    [35.50, 31.14],[35.48, 31.18],[35.45, 31.22],
    [35.47, 31.26],[35.50, 31.30],[35.53, 31.34],
    [35.55, 31.38],[35.56, 31.42],[35.57, 31.46],
  ];

  return feat({ id: 'moab', name: 'Moab', type: 'kingdom',
    fillColor: '#E06666', strokeColor: '#A03030' }, ring);
}

// ============================================================
// EDOM — south of Moab, east of Arabah
// ============================================================
function buildEdom() {
  const ring = [
    // Start at Dead Sea SE / Zered, go clockwise
    // North: Zered line going east (shared with Moab south)
    [35.48, 30.98],[35.55, 30.97],[35.70, 30.96],
    [35.85, 30.96],[36.00, 30.97],
    // East: desert border going south
    [36.15, 30.85],[36.22, 30.65],[36.25, 30.45],
    [36.22, 30.25],[36.15, 30.05],
    [36.00, 29.85],[35.80, 29.68],[35.50, 29.55],
    [35.20, 29.50],
    // South: Gulf of Aqaba / Eilat
    [34.98, 29.52],[34.95, 29.55],
    // West: Arabah valley going north (rift south of Dead Sea)
    [35.00, 29.70],[35.05, 29.90],[35.08, 30.10],
    [35.12, 30.30],[35.18, 30.50],[35.22, 30.65],
    [35.28, 30.80],[35.33, 30.90],[35.36, 30.98],
    // Close at Dead Sea SW
  ];

  return feat({ id: 'edom', name: 'Edom', type: 'kingdom',
    fillColor: '#E8A838', strokeColor: '#996B10' }, ring);
}

// ============================================================
// AMMON — east of Gilead, centered on Rabbah (Amman)
// ============================================================
function buildAmmon() {
  const ring = [
    // Clockwise from NW (Jabbok / Gilead border)
    [35.75, 32.10],[35.82, 32.18],[35.90, 32.24],
    [36.00, 32.28],[36.15, 32.28],[36.30, 32.24],
    [36.42, 32.18],
    // East going south
    [36.45, 32.05],[36.42, 31.90],[36.38, 31.78],
    [36.32, 31.68],[36.22, 31.58],[36.10, 31.52],
    // South: approaches Arnon
    [35.95, 31.48],[35.82, 31.48],
    // West: Gilead hills going north
    [35.72, 31.52],[35.68, 31.62],[35.66, 31.72],
    [35.67, 31.82],[35.70, 31.92],[35.73, 32.02],
  ];

  return feat({ id: 'ammon', name: 'Ammon', type: 'kingdom',
    fillColor: '#9B6BB6', strokeColor: '#6A3D7D' }, ring);
}

// ============================================================
// ARAM-DAMASCUS
// ============================================================
function buildAramDamascus() {
  const ring = [
    // Clockwise from SW (east of Sea of Galilee / Golan)
    // West: Golan / Anti-Lebanon going north
    [35.64, 32.90],[35.66, 32.95],[35.70, 33.05],
    [35.76, 33.15],[35.82, 33.25],
    [35.88, 33.40],[35.92, 33.55],[35.95, 33.70],
    [36.00, 33.85],[36.05, 34.00],[36.12, 34.15],
    [36.22, 34.28],
    // North
    [36.45, 34.38],[36.70, 34.35],[36.95, 34.25],
    [37.15, 34.10],
    // East going south
    [37.30, 33.90],[37.35, 33.65],[37.30, 33.40],
    [37.18, 33.15],[37.00, 32.90],[36.80, 32.70],
    [36.60, 32.55],
    // South: meets Ammon border
    [36.42, 32.40],[36.30, 32.28],[36.15, 32.30],
    [36.00, 32.32],[35.85, 32.40],[35.75, 32.50],
    // SW: east of Sea of Galilee
    [35.68, 32.60],[35.65, 32.70],
    [35.63, 32.74],[35.64, 32.78],[35.65, 32.82],
    [35.65, 32.86],[35.64, 32.90],
  ];

  return feat({ id: 'aram-damascus', name: 'Aram-Damascus', type: 'kingdom',
    fillColor: '#48B3B3', strokeColor: '#2D7A7A' }, ring);
}

// ============================================================
// PHOENICIA — Lebanese coast, Tyre to Byblos
// ============================================================
function buildPhoenicia() {
  const coast = coastSlice(33.09, 34.42);

  const ring = [
    ...coast,
    // Inland border along Lebanon Mountains going south
    [36.00, 34.42],[35.98, 34.30],[35.95, 34.18],
    [35.90, 34.05],[35.85, 33.92],[35.80, 33.78],
    [35.75, 33.65],[35.70, 33.52],[35.65, 33.40],
    [35.58, 33.28],[35.50, 33.18],[35.40, 33.09],
  ];

  return feat({ id: 'phoenicia', name: 'Phoenicia', type: 'kingdom',
    fillColor: '#2ECC71', strokeColor: '#1A8B4C' }, ring);
}

// ============================================================
// ASSYRIAN EMPIRE
// ============================================================
function buildAssyria() {
  const ring = [
    // SW: near Aram border
    [36.20, 34.28],[36.80, 35.00],[37.20, 35.50],
    [37.50, 36.00],[38.00, 36.80],[38.50, 37.00],
    // North: Anatolia / Armenia
    [39.50, 37.30],[40.50, 37.50],[41.50, 37.40],
    [42.50, 37.20],[43.50, 37.10],[44.50, 36.80],
    // East: Zagros
    [45.20, 36.20],[45.50, 35.50],[45.40, 34.80],
    [45.20, 34.20],[44.80, 33.50],[44.40, 33.20],
    // South: Mesopotamia
    [43.50, 32.80],[42.50, 33.00],[41.50, 33.30],
    [40.50, 33.60],[39.50, 34.00],
    // SW
    [38.50, 34.30],[37.50, 34.50],[37.00, 34.30],
    [36.70, 34.35],[36.20, 34.28],
  ];

  return feat({ id: 'assyrian-empire', name: 'Assyrian Empire', type: 'empire',
    fillColor: '#C0392B', strokeColor: '#922B21' }, ring);
}

// ============================================================
// EGYPT
// ============================================================
function buildEgypt() {
  const ring = [
    // Mediterranean coast E → W
    [34.22, 31.27],[34.10, 31.18],[34.00, 31.14],[33.90, 31.10],
    [33.81, 31.08],[33.40, 31.07],[33.00, 31.07],[32.60, 31.08],
    [32.20, 31.09],[31.80, 31.07],[31.40, 31.10],[31.20, 31.20],
    [30.80, 31.30],[30.40, 31.38],[30.00, 31.45],[29.70, 31.35],
    // South along Nile
    [29.80, 30.80],[30.00, 30.20],[30.50, 29.50],
    [31.00, 28.80],[31.20, 28.50],
    // East: desert border
    [32.00, 28.50],[32.80, 28.80],[33.20, 29.20],
    [33.50, 29.60],[33.80, 30.00],[34.00, 30.30],
    [34.15, 30.60],[34.20, 30.90],[34.22, 31.10],
  ];

  return feat({ id: 'egypt', name: 'Egypt', type: 'empire',
    fillColor: '#C4956A', strokeColor: '#8B5E3C' }, ring);
}

// ============================================================
// MAIN
// ============================================================
function main() {
  const features = [
    buildJudah(),
    buildIsrael(),
    buildAssyria(),
    buildEgypt(),
    buildPhilistia(),
    buildMoab(),
    buildEdom(),
    buildAmmon(),
    buildAramDamascus(),
    buildPhoenicia(),
  ];

  const fc = { type: 'FeatureCollection', features };
  const json = JSON.stringify(fc, null, 2);
  const out = join(__dirname, '..', 'public', 'data', 'boundaries', 'period-0930-0586', 'boundaries.geojson');
  writeFileSync(out, json);

  console.log(`Generated ${features.length} features`);
  console.log(`File size: ${(Buffer.byteLength(json) / 1024).toFixed(1)} KB`);
  for (const f of features) {
    console.log(`  ${f.properties.id}: ${f.geometry.coordinates[0].length} pts`);
  }
}

main();
