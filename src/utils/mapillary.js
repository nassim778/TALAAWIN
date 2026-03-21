import { getLocations } from './locations';

const ACCESS_TOKEN = 'MLY|33966536759628340|e7e1834c89f057f2cba455515bd475c2';
const API_BASE = 'https://graph.mapillary.com';
const TIMEOUT_MS = 5000;
const BATCH_SIZE = 5;
const MAX_STEPS = 5;

const usedNames = new Set();

export function resetUsedLocations() {
  usedNames.clear();
  Object.values(pools).forEach((p) => { p.queue = []; });
}

function pickRandom(max, count, exclude = new Set()) {
  const pool = [];
  for (let i = 0; i < max; i++) {
    if (!exclude.has(i)) pool.push(i);
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function raceToFirst(promises) {
  return new Promise((resolve, reject) => {
    let errors = 0;
    const total = promises.length;
    if (total === 0) return reject(new Error('Empty'));
    promises.forEach((p) => {
      Promise.resolve(p)
        .then(resolve)
        .catch(() => {
          errors++;
          if (errors === total) reject(new Error('All failed'));
        });
    });
  });
}

function distanceDeg(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function buildWalkable(valid) {
  const seqGroups = {};
  valid.forEach((img) => {
    const seq = img.sequence || img.id;
    if (!seqGroups[seq]) seqGroups[seq] = [];
    seqGroups[seq].push(img);
  });

  let bestSeq = null;
  let bestLen = 0;
  Object.keys(seqGroups).forEach((seq) => {
    if (seqGroups[seq].length > bestLen) {
      bestLen = seqGroups[seq].length;
      bestSeq = seq;
    }
  });

  const seqImages = bestSeq ? seqGroups[bestSeq] : [valid[0]];

  const ordered = [seqImages[0]];
  const remaining = seqImages.slice(1);
  while (remaining.length > 0 && ordered.length < MAX_STEPS) {
    const last = ordered[ordered.length - 1].computed_geometry.coordinates;
    let nearestIdx = 0;
    let nearestDist = Infinity;
    remaining.forEach((img, i) => {
      const d = distanceDeg(last, img.computed_geometry.coordinates);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    });
    ordered.push(remaining.splice(nearestIdx, 1)[0]);
  }

  return ordered.map((img) => ({
    id: img.id,
    imageUrl: img.thumb_2048_url,
    coordinates: {
      latitude: img.computed_geometry.coordinates[1],
      longitude: img.computed_geometry.coordinates[0],
    },
  }));
}

async function tryLocation(location) {
  const bbox = location.bbox.join(',');
  const url = `${API_BASE}/images?access_token=${ACCESS_TOKEN}&fields=id,thumb_2048_url,computed_geometry,sequence&bbox=${bbox}&limit=20`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const valid = (data.data || []).filter(
      (img) => img.thumb_2048_url && img.computed_geometry
    );
    if (valid.length === 0) throw new Error('No images at this location');

    const walkable = buildWalkable(valid);

    return {
      id: walkable[0].id,
      imageUrl: walkable[0].imageUrl,
      coordinates: walkable[0].coordinates,
      locationName: location.name,
      country: location.country,
      walkable,
    };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Fetches a random street-level image with walkable sequence neighbors.
 */
export async function fetchRandomImage(mode = 'world') {
  const locations = getLocations(mode);
  const tried = new Set();
  locations.forEach((loc, i) => { if (usedNames.has(loc.name)) tried.add(i); });

  for (let wave = 0; wave < 3; wave++) {
    const indices = pickRandom(locations.length, BATCH_SIZE, tried);
    if (indices.length === 0) break;
    indices.forEach((i) => tried.add(i));

    try {
      const result = await raceToFirst(
        indices.map((i) => tryLocation(locations[i]))
      );
      usedNames.add(result.locationName);
      return result;
    } catch {
      // wave failed, try next batch
    }
  }

  throw new Error('No images found. Please try again.');
}

// ── Image pool for instant round transitions ──
const pools = {};

function getPool(mode) {
  if (!pools[mode]) pools[mode] = { queue: [], filling: false };
  return pools[mode];
}

async function fillPool(mode, target = 2) {
  const pool = getPool(mode);
  if (pool.filling) return;
  pool.filling = true;
  try {
    while (pool.queue.length < target) {
      const img = await fetchRandomImage(mode);
      pool.queue.push(img);
    }
  } catch {
    // best-effort
  }
  pool.filling = false;
}

export function takeFromPool(mode) {
  const pool = getPool(mode);
  while (pool.queue.length > 0) {
    const img = pool.queue.shift();
    if (!usedNames.has(img.locationName)) {
      usedNames.add(img.locationName);
      fillPool(mode);
      return img;
    }
  }
  fillPool(mode);
  return null;
}

export function warmPool(mode) {
  fillPool(mode);
}
