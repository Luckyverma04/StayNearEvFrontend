import L from "leaflet";

const ACCENT = "#00E5A8";

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
                fill="${active ? "#F8FAFC" : ACCENT}" stroke="#020617" stroke-width="2"/>
          <path d="M19.5 9 12 20h5l-1.5 9L23 18h-5l1.5-9z" fill="#020617"/>
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

// Dark map tiles (CARTO, free — attribution zaroori hai)
export const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
