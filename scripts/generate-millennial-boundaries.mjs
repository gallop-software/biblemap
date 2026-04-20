import * as turf from '@turf/turf';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================
// REFERENCE POLYLINES
// All coordinates: [longitude, latitude] (GeoJSON standard)
// ============================================================

// Mediterranean coastline: Wadi el-Arish (S) to Latakia/Ugarit (N)
const MEDITERRANEAN_COAST = [
  [33.81, 31.08],  // Wadi el-Arish mouth (Brook of Egypt)
  [33.90, 31.10],
  [34.00, 31.14],
  [34.10, 31.18],
  [34.17, 31.22],
  [34.22, 31.27],  // Rafah coast
  [34.27, 31.32],
  [34.32, 31.38],
  [34.36, 31.42],
  [34.40, 31.47],
  [34.43, 31.52],  // Gaza coast
  [34.46, 31.58],
  [34.49, 31.62],
  [34.52, 31.66],  // Ashkelon
  [34.55, 31.71],
  [34.58, 31.76],
  [34.61, 31.80],  // Ashdod
  [34.63, 31.84],
  [34.66, 31.88],
  [34.68, 31.92],
  [34.70, 31.96],
  [34.74, 32.02],
  [34.76, 32.05],  // Jaffa
  [34.78, 32.10],
  [34.79, 32.15],
  [34.81, 32.20],
  [34.83, 32.25],
  [34.85, 32.30],  // Netanya
  [34.86, 32.35],
  [34.87, 32.40],
  [34.88, 32.45],
  [34.89, 32.50],  // Caesarea
  [34.89, 32.55],
  [34.88, 32.60],
  [34.87, 32.65],
  [34.87, 32.70],
  [34.87, 32.75],
  [34.86, 32.79],
  [34.84, 32.82],  // Mount Carmel headland
  [34.86, 32.83],
  [34.92, 32.82],  // Haifa Bay
  [34.97, 32.83],
  [34.99, 32.85],  // Haifa
  [35.02, 32.88],
  [35.05, 32.92],  // Acre (Akko)
  [35.07, 32.96],
  [35.08, 33.00],
  [35.10, 33.05],
  [35.10, 33.09],  // Rosh HaNikra
  [35.12, 33.13],
  [35.14, 33.17],
  [35.18, 33.22],
  [35.20, 33.27],  // Tyre
  [35.23, 33.32],
  [35.26, 33.37],
  [35.30, 33.42],
  [35.33, 33.47],
  [35.36, 33.53],
  [35.38, 33.57],  // Sidon
  [35.40, 33.62],
  [35.42, 33.67],
  [35.44, 33.72],
  [35.46, 33.78],
  [35.48, 33.83],
  [35.50, 33.88],  // Beirut
  [35.52, 33.92],
  [35.55, 33.97],
  [35.57, 34.02],
  [35.60, 34.07],
  [35.63, 34.12],  // Byblos (Jbeil)
  [35.66, 34.18],
  [35.70, 34.24],
  [35.74, 34.30],
  [35.78, 34.36],
  [35.82, 34.42],  // Tripoli
  [35.84, 34.48],
  [35.86, 34.54],
  [35.87, 34.60],
  [35.88, 34.66],
  [35.88, 34.72],
  [35.87, 34.78],
  [35.87, 34.84],
  [35.87, 34.89],  // Tartus
  [35.88, 34.95],
  [35.90, 35.02],
  [35.92, 35.10],
  [35.93, 35.18],
  [35.92, 35.25],
  [35.89, 35.33],
  [35.85, 35.40],
  [35.80, 35.47],
  [35.78, 35.52],  // Latakia / Ugarit area
];

// Northern border: Latakia coast → Euphrates at Carchemish
const NORTHERN_BORDER = [
  [35.78, 35.52],  // Latakia (coast endpoint)
  [35.95, 35.60],
  [36.15, 35.70],
  [36.35, 35.82],
  [36.55, 35.95],
  [36.75, 36.08],
  [36.95, 36.20],  // near Aleppo
  [37.15, 36.33],
  [37.35, 36.46],
  [37.55, 36.58],
  [37.75, 36.68],
  [38.01, 36.83],  // Carchemish on the Euphrates
];

// Euphrates River: Carchemish → Abu Kamal (NW to SE)
const EUPHRATES_RIVER = [
  [38.01, 36.83],  // Carchemish / Jarabulus
  [38.03, 36.75],
  [38.07, 36.65],
  [38.12, 36.55],
  [38.18, 36.45],
  [38.24, 36.35],
  [38.30, 36.25],
  [38.37, 36.15],
  [38.44, 36.05],
  [38.52, 35.97],
  [38.58, 35.90],  // Tabqa Dam area
  [38.65, 35.87],
  [38.75, 35.88],
  [38.85, 35.90],
  [38.95, 35.93],
  [39.02, 35.95],  // Raqqa
  [39.12, 35.92],
  [39.22, 35.86],
  [39.32, 35.78],
  [39.42, 35.70],
  [39.52, 35.62],
  [39.62, 35.55],
  [39.72, 35.48],
  [39.82, 35.42],
  [39.95, 35.37],
  [40.08, 35.34],  // Deir ez-Zor
  [40.18, 35.28],
  [40.28, 35.18],
  [40.38, 35.05],
  [40.45, 34.95],  // Al-Mayadin
  [40.55, 34.82],
  [40.65, 34.68],
  [40.75, 34.55],
  [40.85, 34.48],
  [40.92, 34.45],  // Abu Kamal (Syria-Iraq border)
];

// Desert connection: Abu Kamal → Gulf of Aqaba area (SW through desert)
const DESERT_SOUTH = [
  [40.92, 34.45],  // Abu Kamal
  [40.50, 34.00],
  [40.00, 33.50],
  [39.50, 33.00],
  [39.00, 32.50],
  [38.50, 32.00],
  [38.00, 31.50],
  [37.50, 31.00],
  [37.00, 30.60],
  [36.50, 30.25],
  [36.00, 29.90],
  [35.50, 29.65],
  [35.10, 29.50],  // approaching Eilat/Aqaba
];

// Gulf of Aqaba western coast: Sinai tip (S) → Eilat (N)
const GULF_OF_AQABA = [
  [34.30, 27.80],  // near Sharm el-Sheikh / Sinai tip
  [34.36, 27.95],
  [34.42, 28.10],
  [34.47, 28.25],
  [34.50, 28.40],
  [34.55, 28.55],
  [34.60, 28.70],
  [34.65, 28.85],
  [34.72, 29.00],
  [34.80, 29.15],
  [34.88, 29.30],
  [34.95, 29.50],  // Eilat
  [35.10, 29.50],  // connects to desert south
];

// Sinai southern coast: Sharm area → Gulf of Suez → Nile delta
const SINAI_SOUTH = [
  [34.30, 27.80],  // Sharm el-Sheikh area (matches Gulf of Aqaba start)
  [34.15, 27.85],
  [34.00, 27.90],
  [33.85, 27.95],
  [33.70, 28.05],
  [33.55, 28.18],
  [33.40, 28.35],
  [33.25, 28.55],
  [33.10, 28.75],
  [32.95, 29.00],  // Gulf of Suez area
  [32.80, 29.20],
  [32.65, 29.45],
  [32.50, 29.70],
  [32.40, 29.90],
  [32.30, 30.10],
  [32.15, 30.25],
  [32.00, 30.40],
  [31.80, 30.55],
  [31.60, 30.70],
  [31.50, 30.80],
  [31.30, 30.90],
  [31.20, 31.00],  // Nile delta area
];

// Northern Sinai coast: Nile delta → Wadi el-Arish (W to E along Mediterranean)
const NILE_TO_ARISH = [
  [31.20, 31.00],  // Nile delta area
  [31.40, 31.02],
  [31.60, 31.05],
  [31.80, 31.07],
  [32.00, 31.08],
  [32.20, 31.09],
  [32.40, 31.09],
  [32.60, 31.08],
  [32.80, 31.07],
  [33.00, 31.07],
  [33.20, 31.07],
  [33.40, 31.07],
  [33.60, 31.08],
  [33.81, 31.08],  // Wadi el-Arish (closes to coast start)
];

// Eastern boundary of Ezekiel 47 tribal allocation (S → N)
// Runs along: Tamar → Dead Sea eastern shore → Jordan valley → Sea of Galilee → Golan → Hauran
const EAST_BORDER_S2N = [
  [35.30, 30.98],  // Tamar (south of Dead Sea)
  [35.44, 31.02],
  [35.50, 31.10],
  [35.54, 31.18],
  [35.57, 31.26],
  [35.58, 31.34],
  [35.59, 31.42],
  [35.59, 31.50],  // mid Dead Sea eastern shore
  [35.58, 31.58],
  [35.57, 31.66],
  [35.56, 31.74],
  [35.55, 31.80],  // northern Dead Sea
  [35.57, 31.88],
  [35.58, 31.96],  // Jordan valley
  [35.58, 32.04],
  [35.59, 32.12],
  [35.60, 32.20],
  [35.60, 32.28],
  [35.61, 32.36],
  [35.62, 32.44],  // Beit She'an area
  [35.63, 32.52],
  [35.64, 32.60],
  [35.65, 32.68],
  [35.66, 32.72],  // SE Sea of Galilee
  [35.67, 32.78],
  [35.67, 32.83],  // eastern Sea of Galilee
  [35.66, 32.88],
  [35.64, 32.92],  // NE Sea of Galilee
  [35.66, 32.98],
  [35.70, 33.06],  // upper Jordan / Golan
  [35.76, 33.14],
  [35.82, 33.22],
  [35.90, 33.30],
  [35.98, 33.38],  // Golan Heights
  [36.06, 33.46],
  [36.12, 33.54],
  [36.18, 33.62],
  [36.22, 33.70],  // Damascus / Hauran border
  [36.26, 33.78],
  [36.30, 33.86],
  [36.33, 33.94],
  [36.36, 34.02],
  [36.38, 34.10],
  [36.40, 34.18],
  [36.42, 34.26],
  [36.43, 34.34],
  [36.43, 34.40],  // northern Hauran border
];

// ============================================================
// FEATURE PROPERTIES
// ============================================================

const PROMISED_LAND_PROPS = {
  id: 'promised-land',
  name: 'Promised Land (Gen 15:18 / Ex 23:31)',
  type: 'empire',
  fillColor: '#FFD700',
  strokeColor: '#B8960F',
};

const TRIBE_DEFS = [
  { id: 'tribe-dan',       name: 'Dan',                    type: 'tribe',  fillColor: '#1565C0', strokeColor: '#0D47A1' },
  { id: 'tribe-asher',     name: 'Asher',                  type: 'tribe',  fillColor: '#558B2F', strokeColor: '#33691E' },
  { id: 'tribe-naphtali',  name: 'Naphtali',               type: 'tribe',  fillColor: '#00838F', strokeColor: '#006064' },
  { id: 'tribe-manasseh',  name: 'Manasseh',               type: 'tribe',  fillColor: '#E65100', strokeColor: '#BF360C' },
  { id: 'tribe-ephraim',   name: 'Ephraim',                type: 'tribe',  fillColor: '#2E7D32', strokeColor: '#1B5E20' },
  { id: 'tribe-reuben',    name: 'Reuben',                 type: 'tribe',  fillColor: '#C62828', strokeColor: '#B71C1C' },
  { id: 'tribe-judah',     name: 'Judah',                  type: 'tribe',  fillColor: '#6A1B9A', strokeColor: '#4A148C' },
  { id: 'sacred-district', name: 'Holy District (Temple)',  type: 'sacred', fillColor: '#FFD700', strokeColor: '#DAA520' },
  { id: 'tribe-benjamin',  name: 'Benjamin',               type: 'tribe',  fillColor: '#0277BD', strokeColor: '#01579B' },
  { id: 'tribe-simeon',    name: 'Simeon',                 type: 'tribe',  fillColor: '#EF6C00', strokeColor: '#E65100' },
  { id: 'tribe-issachar',  name: 'Issachar',               type: 'tribe',  fillColor: '#4527A0', strokeColor: '#311B92' },
  { id: 'tribe-zebulun',   name: 'Zebulun',                type: 'tribe',  fillColor: '#00695C', strokeColor: '#004D40' },
  { id: 'tribe-gad',       name: 'Gad',                    type: 'tribe',  fillColor: '#795548', strokeColor: '#4E342E' },
];

// Tribal allocation latitude range (Ezekiel 47-48)
const TRIBAL_LAT_NORTH = 34.40;  // Lebo-hamath area
const TRIBAL_LAT_SOUTH = 31.08;  // Wadi el-Arish / southern border

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function interpolateAtLat(polyline, targetLat) {
  for (let i = 0; i < polyline.length - 1; i++) {
    const [lon1, lat1] = polyline[i];
    const [lon2, lat2] = polyline[i + 1];
    const minLat = Math.min(lat1, lat2);
    const maxLat = Math.max(lat1, lat2);
    if (targetLat >= minLat - 0.001 && targetLat <= maxLat + 0.001) {
      if (Math.abs(lat2 - lat1) < 0.0001) return [lon1, targetLat];
      const t = Math.max(0, Math.min(1, (targetLat - lat1) / (lat2 - lat1)));
      const lon = lon1 + t * (lon2 - lon1);
      return [lon, targetLat];
    }
  }
  const dists = polyline.map(([, lat]) => Math.abs(lat - targetLat));
  const idx = dists.indexOf(Math.min(...dists));
  return [polyline[idx][0], targetLat];
}

function slicePolylineS2N(polyline, latSouth, latNorth) {
  const result = [];
  result.push(interpolateAtLat(polyline, latSouth));
  for (const pt of polyline) {
    if (pt[1] > latSouth + 0.0001 && pt[1] < latNorth - 0.0001) {
      result.push(pt);
    }
  }
  result.push(interpolateAtLat(polyline, latNorth));
  return result;
}

function computeCentroid(ring) {
  let sumLon = 0, sumLat = 0, n = ring.length - 1;
  for (let i = 0; i < n; i++) {
    sumLon += ring[i][0];
    sumLat += ring[i][1];
  }
  return [
    Math.round((sumLon / n) * 10000) / 10000,
    Math.round((sumLat / n) * 10000) / 10000,
  ];
}

function truncateCoord(val) {
  return Math.round(val * 10000) / 10000;
}

function truncateRing(ring) {
  return ring.map(([lon, lat]) => [truncateCoord(lon), truncateCoord(lat)]);
}

// ============================================================
// BUILD PROMISED LAND POLYGON (Gen 15:18 / Ex 23:31)
// ============================================================

function buildPromisedLand() {
  const gulfReversed = [...GULF_OF_AQABA].reverse();

  const ring = [
    ...MEDITERRANEAN_COAST,
    ...NORTHERN_BORDER.slice(1),
    ...EUPHRATES_RIVER.slice(1),
    ...DESERT_SOUTH.slice(1),
    ...gulfReversed.slice(1),
    ...SINAI_SOUTH.slice(1),
    ...NILE_TO_ARISH.slice(1),
    MEDITERRANEAN_COAST[0], // close
  ];

  const truncated = truncateRing(ring);
  const labelCoords = computeCentroid(truncated);

  return {
    type: 'Feature',
    properties: { ...PROMISED_LAND_PROPS, labelCoords },
    geometry: { type: 'Polygon', coordinates: [truncated] },
  };
}

// ============================================================
// BUILD TRIBAL STRIPS (Ezekiel 48)
// ============================================================

function buildTribalStrips() {
  const numStrips = TRIBE_DEFS.length;
  const stripHeight = (TRIBAL_LAT_NORTH - TRIBAL_LAT_SOUTH) / numStrips;
  const features = [];

  for (let i = 0; i < numStrips; i++) {
    const latNorth = TRIBAL_LAT_NORTH - i * stripHeight;
    const latSouth = TRIBAL_LAT_NORTH - (i + 1) * stripHeight;

    const westSeg = slicePolylineS2N(MEDITERRANEAN_COAST, latSouth, latNorth);
    const eastSeg = slicePolylineS2N(EAST_BORDER_S2N, latSouth, latNorth).reverse();

    const ring = [...westSeg, ...eastSeg, westSeg[0]];
    const truncated = truncateRing(ring);
    const labelCoords = computeCentroid(truncated);

    features.push({
      type: 'Feature',
      properties: { ...TRIBE_DEFS[i], labelCoords },
      geometry: { type: 'Polygon', coordinates: [truncated] },
    });
  }

  return features;
}

// ============================================================
// MAIN
// ============================================================

function main() {
  const promisedLand = buildPromisedLand();
  const tribalStrips = buildTribalStrips();
  const features = [promisedLand, ...tribalStrips];

  const fc = {
    type: 'FeatureCollection',
    features,
  };

  const json = JSON.stringify(fc, null, 2);
  const outputPath = join(__dirname, '..', 'public', 'data', 'boundaries', 'period-millennial', 'boundaries.geojson');
  writeFileSync(outputPath, json);

  console.log(`Generated ${features.length} features`);
  console.log(`Total coordinate points: ${features.reduce((sum, f) => sum + f.geometry.coordinates[0].length, 0)}`);
  console.log(`File size: ${(Buffer.byteLength(json) / 1024).toFixed(1)} KB`);

  for (const f of features) {
    const pts = f.geometry.coordinates[0].length;
    console.log(`  ${f.properties.id}: ${pts} points, label at [${f.properties.labelCoords}]`);
  }
}

main();
