function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const DECAY = { tunisia: 150, maghreb: 750, world: 2000 };

export function calculateScore(distanceKm, mode = 'world') {
  if (distanceKm <= 0.15) return 5000;
  const decay = DECAY[mode] || DECAY.world;
  const score = Math.round(5000 * Math.exp(-distanceKm / decay));
  return Math.max(0, Math.min(5000, score));
}

export function formatDistance(km, t) {
  const m = t ? t('unitM') : 'm';
  const kmUnit = t ? t('unitKm') : 'km';
  if (km < 1) return `${Math.round(km * 1000)} ${m}`;
  if (km < 100) return `${km.toFixed(1)} ${kmUnit}`;
  return `${Math.round(km).toLocaleString()} ${kmUnit}`;
}

export function getScoreRating(totalScore, t) {
  const maxScore = 25000;
  const ratio = totalScore / maxScore;
  const label = (key, fallback) => (t ? t(key) : fallback);
  if (ratio >= 0.9) return { stars: 5, label: label('ratingPerfect', 'Perfect Explorer!') };
  if (ratio >= 0.7) return { stars: 4, label: label('ratingExcellent', 'Excellent!') };
  if (ratio >= 0.5) return { stars: 3, label: label('ratingGreat', 'Great Job!') };
  if (ratio >= 0.3) return { stars: 2, label: label('ratingGood', 'Good Try!') };
  return { stars: 1, label: label('ratingKeep', 'Keep Exploring!') };
}
