const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (num) => (num * Math.PI) / 180;

  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const isWithinAllowedRadius = (userLat, userLng) => {
  const officeLat = parseFloat(process.env.OFFICE_LAT);
  const officeLng = parseFloat(process.env.OFFICE_LNG);
  const maxDistance = parseFloat(process.env.ALLOWED_DISTANCE_METERS) || 200;

  if (!userLat || !userLng || !officeLat || !officeLng) return false;

  const distance = haversineDistance(officeLat, officeLng, userLat, userLng);
  return { isAllowed: distance <= maxDistance, distance: Math.round(distance) };
};