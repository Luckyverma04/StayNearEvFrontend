// Location / distance helpers

export const hasCoords = (s) =>
  s != null &&
  Number.isFinite(Number(s.latitude)) &&
  Number.isFinite(Number(s.longitude)) &&
  s.latitude !== null &&
  s.longitude !== null;

// Do points ke beech seedhi doori (km) — Haversine formula
export const distanceKm = (a, b) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const formatDistance = (km) => {
  if (km == null || !Number.isFinite(km)) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
};

// Browser se user ki location — Promise me
export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Your browser doesn't support location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        reject(
          new Error(
            err.code === 1
              ? "Location permission denied. Allow location in your browser settings."
              : "Couldn't get your location. Please try again."
          )
        ),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });

// Google Maps directions link
export const directionsUrl = (lat, lng) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

// India ka center — jab koi pin na ho tab map yahan khule
export const DEFAULT_CENTER = { lat: 22.9734, lng: 78.6569 };

// Jab user location allow na kare — default shehar
export const DEFAULT_CITY = { name: "Indore", lat: 22.7196, lng: 75.8577 };

// Public charger ke connector naam → hamare form ke charger types
const CONNECTOR_MAP = [
  [/ccs|combo|type\s*2.*combo/i, "CCS2"],
  [/chademo/i, "CHAdeMO"],
  [/gb\s*\/?\s*-?t/i, "GB/T"],
  [/tesla/i, "Tesla Supercharger"],
  [/bharat.*ac|ac\s*-?001/i, "Bharat AC001"],
  [/bharat.*dc|dc\s*-?001/i, "Bharat DC001"],
  [/type\s*2|mennekes|iec\s*62196/i, "Type 2"],
];
export const toFormChargerTypes = (connectors = []) => {
  const out = new Set();
  for (const c of connectors) {
    const hit = CONNECTOR_MAP.find(([re]) => re.test(c.type || ""));
    if (hit) out.add(hit[1]);
  }
  return [...out];
};

// "Ye charger aapka hai?" → Add Station form, pehle se bhara hua (URL me, taaki login ke baad bhi rahe)
export const listChargerUrl = (c) => {
  const q = new URLSearchParams({
    from: "public",
    name: c.name || "",
    location: c.address || c.name || "",
    lat: String(c.latitude),
    lng: String(c.longitude),
  });
  const types = toFormChargerTypes(c.connectors);
  if (types.length) q.set("types", types.join(","));
  return `/stations/create?${q.toString()}`;
};

// Demo stations sirf tab dikhao jab .env me VITE_SHOW_DEMO=true ho (local testing)
export const SHOW_DEMO = String(import.meta.env.VITE_SHOW_DEMO).toLowerCase() === "true";
