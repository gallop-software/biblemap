import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================
// REFERENCE: Mediterranean coastline [lon, lat] S → N
// (mirrors the coast used in generate-divided-kingdom-boundaries.mjs)
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
  const labelCoords = props.labelCoords || centroid(t);
  return { type: 'Feature', properties: { ...props, labelCoords }, geometry: { type: 'Polygon', coordinates: [t] } };
}

// ============================================================
// SHARED BORDERS
// ============================================================
// Judaea / Samaria border: roughly east–west around Antipatris ~32.10°N
const JUDAEA_SAMARIA_BORDER = [
  [34.78, 32.10], [34.95, 32.08], [35.10, 32.06],
  [35.20, 32.04], [35.30, 32.02], [35.40, 32.00],
  [35.50, 31.98], // meets Jordan River
];

// Samaria / Galilee border: Jezreel Valley ~32.55°N
const SAMARIA_GALILEE_BORDER = [
  [34.88, 32.58], [35.00, 32.56], [35.15, 32.55],
  [35.30, 32.55], [35.45, 32.56], [35.55, 32.58], // meets Jordan
];

// Jordan River / Sea of Galilee western shore (S → N)
// from Dead Sea NW (~31.78) up to NW Sea of Galilee (~32.90)
const JORDAN_WEST = [
  [35.50, 31.78], [35.51, 31.85], [35.52, 31.95], [35.50, 31.98],
  [35.51, 32.10], [35.51, 32.20], [35.52, 32.32], [35.53, 32.42],
  [35.55, 32.52], [35.55, 32.58], [35.55, 32.65], [35.54, 32.70],
  [35.53, 32.74], [35.52, 32.78], [35.51, 32.82], [35.52, 32.86],
  [35.53, 32.90],
];

// ============================================================
// JUDAEA (Roman province under Pilate, ~30 AD)
// Includes Judaea proper + Idumaea (south).  Samaria is shown separately.
// ============================================================
function buildJudaea() {
  const coast = coastSlice(31.08, 32.10);
  const ring = [
    ...coast,
    // North: Judaea/Samaria border east to Jordan
    ...JUDAEA_SAMARIA_BORDER,
    // East: Jordan / Dead Sea west shore going south
    [35.50, 31.95], [35.48, 31.85], [35.46, 31.78],
    [35.44, 31.70], [35.42, 31.60], [35.40, 31.50],
    [35.38, 31.40], [35.37, 31.30], [35.38, 31.20],
    [35.40, 31.10], [35.40, 31.00],
    // South: Idumaea / Negev down to ~30.55
    [35.30, 30.85], [35.10, 30.70], [34.90, 30.62],
    [34.70, 30.65], [34.50, 30.75], [34.30, 30.90],
    [34.15, 31.00],
  ];
  return feat({
    id: 'judaea', name: 'Judaea', type: 'province',
    fillColor: '#8B0000', strokeColor: '#5C0000',
    labelCoords: [35.05, 31.55],
  }, ring);
}

// ============================================================
// SAMARIA (Roman territory, between Judaea and Galilee)
// ============================================================
function buildSamaria() {
  const coast = coastSlice(32.10, 32.58);
  const ring = [
    ...coast,
    // North: Samaria/Galilee border east to Jordan
    ...SAMARIA_GALILEE_BORDER,
    // East: Jordan west bank going south
    [35.55, 32.52], [35.53, 32.42], [35.52, 32.32],
    [35.51, 32.20], [35.51, 32.10], [35.50, 31.98],
    // South: Judaea/Samaria border going west to coast
    ...JUDAEA_SAMARIA_BORDER.slice().reverse(),
  ];
  return feat({
    id: 'samaria', name: 'Samaria', type: 'province',
    fillColor: '#C0392B', strokeColor: '#7B2418',
    labelCoords: [35.12, 32.32],
  }, ring);
}

// ============================================================
// GALILEE (Herod Antipas, NT-era)
// ============================================================
function buildGalilee() {
  const coast = coastSlice(32.58, 33.09);
  const ring = [
    ...coast,
    // North: into upper Galilee toward Hula valley
    [35.18, 33.18], [35.28, 33.20], [35.38, 33.18],
    [35.45, 33.10], [35.50, 33.00],
    // East: down west of Hula → NW Sea of Galilee → Jordan
    [35.55, 32.92], [35.55, 32.86], [35.54, 32.80],
    [35.53, 32.74], [35.55, 32.70], [35.55, 32.65],
    [35.55, 32.58],
    // South: Samaria/Galilee border west to coast
    ...SAMARIA_GALILEE_BORDER.slice().reverse(),
  ];
  return feat({
    id: 'galilee', name: 'Galilee', type: 'tetrarchy',
    fillColor: '#D4A017', strokeColor: '#8B6914',
    labelCoords: [35.20, 32.85],
  }, ring);
}

// ============================================================
// PEREA (Herod Antipas, east of Jordan)
// ============================================================
function buildPerea() {
  const ring = [
    // West: Jordan east bank S → N
    [35.55, 31.78], [35.57, 31.90], [35.58, 32.00],
    [35.58, 32.12], [35.58, 32.24], [35.59, 32.34],
    [35.60, 32.42], [35.62, 32.50],
    // North: Decapolis border (south of Pella ~32.45)
    [35.75, 32.48], [35.90, 32.42], [36.00, 32.32],
    // East: desert border south
    [36.10, 32.10], [36.12, 31.90], [36.10, 31.70],
    [36.05, 31.55], [35.95, 31.45],
    // South: north edge of Nabataea / Moab plateau, west to Dead Sea
    [35.85, 31.45], [35.75, 31.48], [35.65, 31.55],
    [35.60, 31.65], [35.57, 31.72],
  ];
  return feat({
    id: 'perea', name: 'Perea', type: 'tetrarchy',
    fillColor: '#B8860B', strokeColor: '#7A5808',
    labelCoords: [35.85, 31.95],
  }, ring);
}

// ============================================================
// DECAPOLIS — Greek city league east of the Sea of Galilee
// ============================================================
function buildDecapolis() {
  const ring = [
    // SW: NE corner of Perea boundary
    [35.62, 32.50], [35.60, 32.60], [35.62, 32.72],
    // West: east shore of Sea of Galilee going north
    [35.65, 32.78], [35.66, 32.84], [35.67, 32.90],
    // North: south of Iturea, going east
    [35.85, 32.95], [36.05, 32.95], [36.25, 32.92],
    [36.45, 32.85],
    // East: desert border going south
    [36.55, 32.65], [36.55, 32.40], [36.45, 32.20],
    // South: meets Perea/Ammon area
    [36.30, 32.20], [36.10, 32.25], [35.95, 32.32],
    [35.80, 32.42], [35.70, 32.48],
  ];
  return feat({
    id: 'decapolis', name: 'Decapolis', type: 'region',
    fillColor: '#6B5B95', strokeColor: '#3E335C',
    labelCoords: [36.05, 32.60],
  }, ring);
}

// ============================================================
// ITUREA & TRACHONITIS (Philip the Tetrarch — Caesarea Philippi)
// ============================================================
function buildItureaTrachonitis() {
  const ring = [
    // SW: north end of Sea of Galilee / Hula valley
    [35.55, 32.92], [35.50, 33.00], [35.45, 33.10],
    [35.50, 33.20], [35.55, 33.28],
    // North: foothills of Mt Hermon → Damascus border
    [35.65, 33.40], [35.85, 33.45], [36.05, 33.40],
    [36.25, 33.30], [36.40, 33.15],
    // East: desert / Trachonitis (Hauran lava plateau)
    [36.55, 32.95], [36.60, 32.75],
    // South: Decapolis north border going west
    [36.45, 32.85], [36.25, 32.92], [36.05, 32.95],
    [35.85, 32.95], [35.67, 32.90], [35.60, 32.92],
  ];
  return feat({
    id: 'iturea-trachonitis', name: 'Iturea & Trachonitis', type: 'tetrarchy',
    fillColor: '#2D7D7A', strokeColor: '#1A4A48',
    labelCoords: [36.10, 33.10],
  }, ring);
}

// ============================================================
// PHOENICIA (part of Roman province of Syria; cities Tyre, Sidon)
// ============================================================
function buildPhoenicia() {
  const coast = coastSlice(33.09, 34.42);
  const ring = [
    ...coast,
    // Inland border along Lebanon Mountains going south
    [36.00, 34.42], [35.98, 34.30], [35.95, 34.18],
    [35.90, 34.05], [35.85, 33.92], [35.80, 33.78],
    [35.75, 33.65], [35.70, 33.52], [35.65, 33.40],
    [35.55, 33.28], [35.50, 33.20], [35.45, 33.10],
  ];
  return feat({
    id: 'phoenicia', name: 'Phoenicia', type: 'region',
    fillColor: '#2ECC71', strokeColor: '#1A8B4C',
    labelCoords: [35.55, 33.65],
  }, ring);
}

// ============================================================
// NABATAEA (kingdom south & east of Judaea/Perea; capital Petra)
// ============================================================
function buildNabataea() {
  const ring = [
    // NW: Dead Sea SE corner / Zered
    [35.40, 31.00], [35.50, 30.95], [35.65, 30.92],
    [35.85, 30.92], [36.00, 30.95],
    // North along Perea south edge eastward
    [35.95, 31.45], [36.05, 31.55], [36.10, 31.70],
    [36.12, 31.90], [36.20, 32.00],
    // East: desert border far south
    [36.40, 31.80], [36.55, 31.40], [36.55, 30.90],
    [36.40, 30.40], [36.20, 29.95], [35.90, 29.55],
    [35.50, 29.30], [35.10, 29.25],
    // South: Gulf of Aqaba
    [34.95, 29.40], [34.95, 29.55],
    // West: Arabah valley going north
    [35.00, 29.80], [35.05, 30.05], [35.10, 30.30],
    [35.18, 30.55], [35.25, 30.75], [35.32, 30.90],
  ];
  return feat({
    id: 'nabataea', name: 'Nabataea', type: 'kingdom',
    fillColor: '#C97B63', strokeColor: '#82452F',
    labelCoords: [35.85, 30.45],
  }, ring);
}

// ============================================================
// SYRIA (Roman province, north of Palestine; capital Antioch)
// Stub polygon for context — keeps map identifiable as Roman era.
// ============================================================
function buildSyria() {
  const ring = [
    // SW: north of Phoenicia / Iturea
    [36.00, 34.42], [36.40, 33.15], [36.55, 32.95],
    [36.60, 32.75], [36.55, 32.65],
    // East: desert border going north
    [37.20, 33.00], [37.80, 33.80], [38.20, 34.50],
    [38.60, 35.30], [38.90, 36.00],
    // North: Anatolia / toward Antioch
    [38.40, 36.50], [37.60, 36.60], [36.70, 36.40],
    [36.20, 36.10], [35.90, 35.55], [35.85, 34.90],
  ];
  return feat({
    id: 'syria', name: 'Syria', type: 'province',
    fillColor: '#5D4E2D', strokeColor: '#3A2F18',
    labelCoords: [37.20, 35.30],
  }, ring);
}

// ============================================================
// EGYPT (Roman province, south)
// ============================================================
function buildEgypt() {
  const ring = [
    [34.22, 31.27], [34.10, 31.18], [34.00, 31.14], [33.90, 31.10],
    [33.81, 31.08], [33.40, 31.07], [33.00, 31.07], [32.60, 31.08],
    [32.20, 31.09], [31.80, 31.07], [31.40, 31.10], [31.20, 31.20],
    [30.80, 31.30], [30.40, 31.38], [30.00, 31.45], [29.70, 31.35],
    [29.80, 30.80], [30.00, 30.20], [30.50, 29.50],
    [31.00, 28.80], [31.20, 28.50],
    [32.00, 28.50], [32.80, 28.80], [33.20, 29.20],
    [33.50, 29.60], [33.80, 30.00], [34.00, 30.30],
    [34.15, 30.60], [34.20, 30.90], [34.22, 31.10],
  ];
  return feat({
    id: 'egypt', name: 'Egypt', type: 'province',
    fillColor: '#C4956A', strokeColor: '#8B5E3C',
    labelCoords: [31.00, 30.20],
  }, ring);
}

// ============================================================
// CITIES of NT importance
// ============================================================
const CITIES = [
  // Capitals & administrative centers
  { id: 'jerusalem',         name: 'Jerusalem',         coords: [35.2332, 31.7767], importance: 'capital', placeId: 'jerusalem' },
  { id: 'caesarea-maritima', name: 'Caesarea Maritima', coords: [34.8920, 32.5000], importance: 'capital', placeId: 'caesarea-maritima' },
  { id: 'tiberias',          name: 'Tiberias',          coords: [35.5320, 32.7950], importance: 'capital', placeId: 'tiberias' },
  { id: 'caesarea-philippi', name: 'Caesarea Philippi', coords: [35.6948, 33.2486], importance: 'capital', placeId: 'caesarea-philippi' },
  { id: 'damascus',          name: 'Damascus',          coords: [36.3000, 33.5100], importance: 'capital', placeId: 'damascus' },
  { id: 'petra',             name: 'Petra',             coords: [35.4444, 30.3285], importance: 'capital', placeId: 'petra' },
  { id: 'antioch',           name: 'Antioch',           coords: [36.1610, 36.2020], importance: 'capital', placeId: 'antioch' },

  // Major NT cities
  { id: 'capernaum',  name: 'Capernaum',  coords: [35.5750, 32.8800], importance: 'major', placeId: 'capernaum' },
  { id: 'nazareth',   name: 'Nazareth',   coords: [35.3030, 32.7000], importance: 'major', placeId: 'nazareth' },
  { id: 'bethlehem',  name: 'Bethlehem',  coords: [35.2000, 31.7050], importance: 'major', placeId: 'bethlehem' },
  { id: 'magadan',    name: 'Magadan',    coords: [35.5167, 32.8267], importance: 'major', placeId: 'magadan' },
  { id: 'bethsaida',  name: 'Bethsaida',  coords: [35.6300, 32.9100], importance: 'major', placeId: 'bethsaida' },
  { id: 'jericho',    name: 'Jericho',    coords: [35.4445, 31.8570], importance: 'major', placeId: 'jericho' },
  { id: 'samaria-sebaste', name: 'Sebaste', coords: [35.1900, 32.2780], importance: 'major', placeId: 'samaria-sebaste' },
  { id: 'sychar',     name: 'Sychar',     coords: [35.2810, 32.2090], importance: 'major', placeId: 'sychar' },
  { id: 'tyre',       name: 'Tyre',       coords: [35.1950, 33.2710], importance: 'major', placeId: 'tyre' },
  { id: 'sidon',      name: 'Sidon',      coords: [35.3750, 33.5630], importance: 'major', placeId: 'sidon' },
  { id: 'gadara',     name: 'Gadara',     coords: [35.6750, 32.6550], importance: 'major', placeId: 'gadara' },
  { id: 'pella',      name: 'Pella',      coords: [35.6190, 32.4490], importance: 'major', placeId: 'pella' },
  { id: 'jerash',     name: 'Gerasa',     coords: [35.8910, 32.2810], importance: 'major', placeId: 'gerasa' },
  { id: 'philadelphia', name: 'Philadelphia', coords: [35.9333, 31.9550], importance: 'major', placeId: 'philadelphia-ammon' },
  { id: 'joppa',      name: 'Joppa',      coords: [34.7500, 32.0500], importance: 'major', placeId: 'joppa' },
  { id: 'gaza',       name: 'Gaza',       coords: [34.4660, 31.5040], importance: 'major', placeId: 'gaza' },
  { id: 'cana',       name: 'Cana',       coords: [35.3390, 32.7470], importance: 'minor', placeId: 'cana' },
  { id: 'nain',       name: 'Nain',       coords: [35.3450, 32.6300], importance: 'minor', placeId: 'nain' },

  // Landmarks (mountains, etc.)
  { id: 'mount-hermon', name: 'Mount Hermon', coords: [35.857, 33.4163], importance: 'landmark', placeId: 'mount-hermon' },

  // Water features (label only, no dot)
  { id: 'sea-of-galilee', name: 'Sea of Galilee', coords: [35.58, 32.81], importance: 'water', placeId: 'sea-of-galilee' },
];

function buildCities() {
  return {
    type: 'FeatureCollection',
    features: CITIES.map(c => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: c.coords },
      properties: { id: c.id, name: c.name, importance: c.importance, placeId: c.placeId },
    })),
  };
}

// ============================================================
// MAIN
// ============================================================
function main() {
  const features = [
    buildJudaea(),
    buildSamaria(),
    buildGalilee(),
    buildPerea(),
    buildDecapolis(),
    buildItureaTrachonitis(),
    buildPhoenicia(),
    buildNabataea(),
    buildSyria(),
    buildEgypt(),
  ];
  const fc = { type: 'FeatureCollection', features };

  const outDir = join(__dirname, '..', 'public', 'data', 'boundaries', 'period-0063bc-0100ad');
  mkdirSync(outDir, { recursive: true });

  const boundariesJson = JSON.stringify(fc, null, 2);
  writeFileSync(join(outDir, 'boundaries.geojson'), boundariesJson);

  const citiesJson = JSON.stringify(buildCities(), null, 2);
  writeFileSync(join(outDir, 'cities.geojson'), citiesJson);

  console.log(`Generated ${features.length} boundary features and ${CITIES.length} cities`);
  console.log(`boundaries.geojson: ${(Buffer.byteLength(boundariesJson) / 1024).toFixed(1)} KB`);
  console.log(`cities.geojson:     ${(Buffer.byteLength(citiesJson) / 1024).toFixed(1)} KB`);
  for (const f of features) {
    console.log(`  ${f.properties.id}: ${f.geometry.coordinates[0].length} pts`);
  }
}

main();
