/**
 * Modular Geolocation & Distance Utilities for PRAHARI MPLADS
 */

export const GHAZIABAD_DEMO_COORDS = {
  lat: 28.6692,
  lng: 77.4538,
  district: 'Ghaziabad',
  state: 'Uttar Pradesh',
  name: 'Ghaziabad, Uttar Pradesh',
};

/**
 * Fallback central coordinate dictionary for Indian cities / districts / parliamentary constituencies
 */
export const CONSTITUENCY_CENTERS = {
  'ghaziabad': { lat: 28.6692, lng: 77.4538, zoom: 12, name: 'Ghaziabad, Uttar Pradesh' },
  'varanasi': { lat: 25.3176, lng: 82.9739, zoom: 12, name: 'Varanasi, Uttar Pradesh' },
  'lucknow': { lat: 26.8467, lng: 80.9462, zoom: 12, name: 'Lucknow, Uttar Pradesh' },
  'mumbai': { lat: 19.0760, lng: 72.8777, zoom: 12, name: 'Mumbai, Maharashtra' },
  'mumbai north': { lat: 19.0760, lng: 72.8777, zoom: 12, name: 'Mumbai North, Maharashtra' },
  'mumbai south': { lat: 18.9388, lng: 72.8354, zoom: 12, name: 'Mumbai South, Maharashtra' },
  'mumbai north east': { lat: 19.0760, lng: 72.8777, zoom: 12, name: 'Mumbai North East, Maharashtra' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, zoom: 12, name: 'Bengaluru, Karnataka' },
  'bengaluru south': { lat: 12.9716, lng: 77.5946, zoom: 12, name: 'Bengaluru South, Karnataka' },
  'bengaluru north': { lat: 13.0358, lng: 77.5970, zoom: 12, name: 'Bengaluru North, Karnataka' },
  'bengaluru central': { lat: 12.9780, lng: 77.6000, zoom: 12, name: 'Bengaluru Central, Karnataka' },
  'bangalore': { lat: 12.9716, lng: 77.5946, zoom: 12, name: 'Bengaluru, Karnataka' },
  'bangalore south': { lat: 12.9716, lng: 77.5946, zoom: 12, name: 'Bengaluru South, Karnataka' },
  'kolkata': { lat: 22.5726, lng: 88.3639, zoom: 12, name: 'Kolkata, West Bengal' },
  'kolkata north': { lat: 22.5726, lng: 88.3639, zoom: 12, name: 'Kolkata North, West Bengal' },
  'kolkata south': { lat: 22.5186, lng: 88.3582, zoom: 12, name: 'Kolkata South, West Bengal' },
  'delhi': { lat: 28.6139, lng: 77.2090, zoom: 12, name: 'New Delhi, Delhi' },
  'new delhi': { lat: 28.6139, lng: 77.2090, zoom: 12, name: 'New Delhi, Delhi' },
  'south delhi': { lat: 28.5355, lng: 77.2100, zoom: 12, name: 'South Delhi, Delhi' },
  'east delhi': { lat: 28.6279, lng: 77.2784, zoom: 12, name: 'East Delhi, Delhi' },
  'patna': { lat: 25.5941, lng: 85.1376, zoom: 12, name: 'Patna, Bihar' },
  'patna sahib': { lat: 25.5941, lng: 85.1376, zoom: 12, name: 'Patna Sahib, Bihar' },
  'bhopal': { lat: 23.2599, lng: 77.4126, zoom: 12, name: 'Bhopal, Madhya Pradesh' },
  'jaipur': { lat: 26.9124, lng: 75.7873, zoom: 12, name: 'Jaipur, Rajasthan' },
  'jaipur rural': { lat: 26.9124, lng: 75.7873, zoom: 12, name: 'Jaipur Rural, Rajasthan' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, zoom: 12, name: 'Ahmedabad, Gujarat' },
  'pune': { lat: 18.5204, lng: 73.8567, zoom: 12, name: 'Pune, Maharashtra' },
  'chennai': { lat: 13.0827, lng: 80.2707, zoom: 12, name: 'Chennai, Tamil Nadu' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, zoom: 12, name: 'Hyderabad, Telangana' },
  'uttar pradesh': { lat: 26.8467, lng: 80.9462, zoom: 7, name: 'Uttar Pradesh' },
  'maharashtra': { lat: 19.7515, lng: 75.7139, zoom: 7, name: 'Maharashtra' },
  'karnataka': { lat: 15.3173, lng: 75.7139, zoom: 7, name: 'Karnataka' },
  'west bengal': { lat: 22.9868, lng: 87.8550, zoom: 7, name: 'West Bengal' },
  'bihar': { lat: 25.0961, lng: 85.3131, zoom: 7, name: 'Bihar' },
  'madhya pradesh': { lat: 22.9734, lng: 78.6569, zoom: 7, name: 'Madhya Pradesh' },
  'rajasthan': { lat: 27.0238, lng: 74.2179, zoom: 7, name: 'Rajasthan' },
  'tamil nadu': { lat: 11.1271, lng: 78.6569, zoom: 7, name: 'Tamil Nadu' },
  'gujarat': { lat: 22.2587, lng: 71.1924, zoom: 7, name: 'Gujarat' },
  'india': { lat: 22.9734, lng: 78.6569, zoom: 5, name: 'Pan-India' },
};

/**
 * Resolves focal center coordinates and zoom for a selected district, constituency, or state.
 */
export function getCoordinatesForDistrict(targetName, projects = []) {
  if (!targetName) return null;
  const key = String(targetName).trim().toLowerCase();

  // 1. Direct dictionary match
  if (CONSTITUENCY_CENTERS[key]) {
    return CONSTITUENCY_CENTERS[key];
  }

  // 2. Partial dictionary match
  const dictKey = Object.keys(CONSTITUENCY_CENTERS).find(
    (k) => key.includes(k) || k.includes(key)
  );
  if (dictKey) {
    return CONSTITUENCY_CENTERS[dictKey];
  }

  // 3. Compute centroid from matching projects in dataset
  if (Array.isArray(projects) && projects.length > 0) {
    const matching = projects.filter((p) => {
      const lat = Number(p.latitude || p.official_record?.latitude);
      const lng = Number(p.longitude || p.official_record?.longitude);
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return false;
      const d = (p.district || '').toLowerCase();
      const c = (p.constituency || p.block_constituency || '').toLowerCase();
      const s = (p.state || '').toLowerCase();
      return d.includes(key) || key.includes(d) || c.includes(key) || key.includes(c) || s.includes(key) || key.includes(s);
    });

    if (matching.length > 0) {
      const sumLat = matching.reduce((acc, p) => acc + Number(p.latitude || p.official_record?.latitude), 0);
      const sumLng = matching.reduce((acc, p) => acc + Number(p.longitude || p.official_record?.longitude), 0);
      return {
        lat: sumLat / matching.length,
        lng: sumLng / matching.length,
        zoom: 12,
        name: targetName,
      };
    }
  }

  return null;
}

/**
 * Calculates Great-Circle Distance between two coordinates in Kilometers (Haversine formula).
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);
  if (isNaN(nLat1) || isNaN(nLon1) || brainCoordInvalid(nLat1, nLon1, nLat2, nLon2)) {
    return null;
  }
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
  const dLon = ((nLon2 - nLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function brainCoordInvalid(a, b, c, d) {
  return isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d);
}

/**
 * Human-readable distance formatter:
 * e.g., 350 m away, 1.2 km away, 4.8 km away
 */
export function formatDistance(km, lang = 'en') {
  if (km == null || isNaN(km)) return '';
  if (km < 1) {
    const meters = Math.max(50, Math.round(km * 1000));
    return lang === 'hi' ? `${meters} मी दूर` : `${meters} m away`;
  }
  return lang === 'hi' ? `${km.toFixed(1)} किमी दूर` : `${km.toFixed(1)} km away`;
}

/**
 * Computes distances from user location to projects and sorts nearest to farthest.
 */
export function getNearbyProjects(projects, userLat, userLng, lang = 'en') {
  if (!projects || userLat == null || userLng == null) return [];
  const uLat = Number(userLat);
  const uLng = Number(userLng);
  if (isNaN(uLat) || isNaN(uLng)) return [];

  return projects
    .filter((p) => {
      const lat = Number(p.latitude || p.official_record?.latitude);
      const lng = Number(p.longitude || p.official_record?.longitude);
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    })
    .map((p) => {
      const lat = Number(p.latitude || p.official_record?.latitude);
      const lng = Number(p.longitude || p.official_record?.longitude);
      const distanceKm = calculateDistanceKm(uLat, uLng, lat, lng);
      return {
        ...p,
        distanceKm,
        distanceFormatted: formatDistance(distanceKm, lang),
      };
    })
    .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
}
