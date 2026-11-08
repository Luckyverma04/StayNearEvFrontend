import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Navigation, Star } from "lucide-react";
import { stationIcon, userIcon, TILE_URL, TILE_ATTRIBUTION } from "./mapIcons";
import { hasCoords, distanceKm, formatDistance, directionsUrl, DEFAULT_CENTER } from "../../utils/geo";

const ACCENT = "#00E5A8";

/* Saare pins (aur user) screen me fit karo */
const FitBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 14 });
  }, [map, points]);
  return null;
};

const StationsMap = ({ stations, userPos, onViewDetails, height = 520 }) => {
  const pinned = useMemo(() => stations.filter(hasCoords), [stations]);
  const missing = stations.length - pinned.length;

  const points = useMemo(() => {
    const pts = pinned.map((s) => [Number(s.latitude), Number(s.longitude)]);
    if (userPos) pts.push([userPos.lat, userPos.lng]);
    return pts;
  }, [pinned, userPos]);

  return (
    <div className="relative">
      <div
        className="snev-map rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/40"
        style={{ height }}
      >
        <MapContainer
          center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
          zoom={5}
          scrollWheelZoom
          style={{ height: "100%", width: "100%", background: "#e8eef3" }}
        >
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} subdomains="abcd" maxZoom={19} />
          <FitBounds points={points} />

          {userPos && (
            <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {pinned.map((s) => {
            const pos = { lat: Number(s.latitude), lng: Number(s.longitude) };
            const dist = userPos ? formatDistance(distanceKm(userPos, pos)) : "";
            return (
              <Marker key={s._id} position={[pos.lat, pos.lng]} icon={stationIcon()}>
                <Popup>
                  <div className="snev-popup">
                    {s.images?.[0] && /^https?:/.test(s.images[0]) && (
                      <img src={s.images[0]} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
                    )}
                    <p className="font-bold text-[15px] text-[#F8FAFC] leading-tight">{s.name}</p>
                    <p className="flex items-center gap-1 text-xs text-[#94A3B8] mt-1">
                      <MapPin className="h-3 w-3 shrink-0" style={{ color: ACCENT }} />
                      <span className="line-clamp-1">{s.location}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="font-semibold" style={{ color: ACCENT }}>
                        ₹{s.pricePerUnit}/kWh
                      </span>
                      {s.averageRating > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-300">
                          <Star className="h-3 w-3 fill-current" /> {Number(s.averageRating).toFixed(1)}
                        </span>
                      )}
                      {dist && <span className="text-sky-300">{dist} away</span>}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => onViewDetails?.(s._id)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-slate-950"
                        style={{ background: ACCENT }}
                      >
                        View &amp; Book
                      </button>
                      <a
                        href={directionsUrl(pos.lat, pos.lng)}
                        target="_blank"
                        rel="noreferrer"
                        title="Directions"
                        className="px-2.5 py-1.5 rounded-lg border border-white/[0.12] text-[#F8FAFC] flex items-center"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {missing > 0 && (
        <p className="mt-3 text-xs text-[#94A3B8]">
          {missing} {missing === 1 ? "station has" : "stations have"} no map pin yet — switch to list view to see{" "}
          {missing === 1 ? "it" : "them"}.
        </p>
      )}
      {pinned.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="px-4 py-3 rounded-xl bg-[#0F172A]/90 border border-white/[0.08] text-sm text-[#94A3B8] backdrop-blur">
            No stations have a map pin yet.
          </div>
        </div>
      )}
    </div>
  );
};

export default StationsMap;
