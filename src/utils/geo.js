/**
 * Modular Geolocation & Distance Utilities for PRahari MPLADS
 */

export const GHAZIABAD_DEMO_COORDS = {
  lat: 28.6692,
  lng: 77.4538,
  district: 'Ghaziabad',
  state: 'Uttar Pradesh',
  name: 'Ghaziabad, Uttar Pradesh',
};

/**
 * Calculates Great-Circle Distance between two coordinates in Kilometers (Haversine formula).
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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

  return projects
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => {
      const distanceKm = calculateDistanceKm(userLat, userLng, p.latitude, p.longitude);
      return {
        ...p,
        distanceKm,
        distanceFormatted: formatDistance(distanceKm, lang),
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
