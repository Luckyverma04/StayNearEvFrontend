import L from "leaflet";

const ACCENT = "#22D3EE";

// Station pin — hara bolt wala marker (image file ki zaroorat nahi)
export const stationIcon = (active = false) =>
  L.divIcon({
    className: "",
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    popupAnchor: [0, -38],
    html: `
      <div style="position:relative;width:36px;height:44px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45));">
        <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 43s15-14.2 15-25.5C33 8.4 26.3 2 18 2S3 8.4 3 17.5C3 28.8 18 43 18 43z"
                fill="${active ? "#F8FAFC" : ACCENT}" stroke="#05061A" stroke-width="2"/>
          <path d="M19.5 9 12 20h5l-1.5 9L23 18h-5l1.5-9z" fill="#05061A"/>
        </svg>
      </div>`,
  });

// Public charger pin (hamare app ka nahi) — neela, plug wala
export const publicIcon = L.divIcon({
  className: "",
  iconSize: [30, 38],
  iconAnchor: [15, 36],
  popupAnchor: [0, -32],
  html: `
    <div style="width:30px;height:38px;filter:drop-shadow(0 4px 8px rgba(0,0,0,.35));">
      <svg width="30" height="38" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 43s15-14.2 15-25.5C33 8.4 26.3 2 18 2S3 8.4 3 17.5C3 28.8 18 43 18 43z"
              fill="#F59E0B" stroke="#ffffff" stroke-width="2.5"/>
        <path d="M14 9v5M22 9v5M11 14h14v3a7 7 0 0 1-14 0v-3zM18 24v4" stroke="#ffffff" stroke-width="2.4"
              stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
    </div>`,
});

// User ki location — neela pulse dot
export const userIcon = L.divIcon({
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: `
    <div style="position:relative;width:22px;height:22px;">
      <span style="position:absolute;inset:0;border-radius:9999px;background:#38BDF8;opacity:.35;animation:snevPulse 1.8s ease-out infinite;"></span>
      <span style="position:absolute;inset:4px;border-radius:9999px;background:#38BDF8;border:2px solid #fff;box-shadow:0 0 0 2px rgba(56,189,248,.35);"></span>
    </div>`,
});

// Map tiles — OpenStreetMap (free, koi API key nahi; attribution zaroori hai).
// Map ka look badalna ho to TILE_URL aur TILE_ATTRIBUTION dono badlo:
//   OpenStreetMap (abhi ye hai):
//     https://tile.openstreetmap.org/{z}/{x}/{y}.png
//   Esri street map (doosra free option):
//     https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}
//     attribution: "Tiles &copy; Esri"
export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
