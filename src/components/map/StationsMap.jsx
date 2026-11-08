import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin, Navigation, Star, Search, Loader2 } from "lucide-react";
import { stationIcon, publicIcon, userIcon, TILE_URL, TILE_ATTRIBUTION } from "./mapIcons";
import { Link } from "react-router-dom";
import { hasCoords, distanceKm, formatDistance, directionsUrl, listChargerUrl, DEFAULT_CENTER } from "../../utils/geo";

const ACCENT = "#22D3EE";

/* Hamare stations (aur user) screen me fit karo — sirf jab wo badlein */
const FitBounds = ({ points }) => {
  const map = useMap();
  const key = JSON.stringify(points);
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 14 });
  }, [map, key]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
};

/* Map hilne par center, zoom aur dikh rahe area ka radius batao */
const AreaWatcher = ({ onChange }) => {
  const map = useMapEvents({
    moveend: () => report(),
    zoomend: () => report(),
  });
  const report = () => {
    const c = map.getCenter();
    const corner = map.getBounds().getNorthEast();
    const r = distanceKm({ lat: c.lat, lng: c.lng }, { lat: corner.lat, lng: corner.lng });
    onChange({ lat: c.lat, lng: c.lng, radiusKm: Math.min(50, Math.max(2, r)), zoom: map.getZoom() });
  };
  useEffect(() => {
    report();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
};

const connectorText = (c) =>
  [c.type, c.powerKW ? `${Math.round(c.powerKW)} kW` : null, c.quantity > 1 ? `×${c.quantity}` : null]
    .filter(Boolean)
    .join(" · ");

/**
 * stations        — hamare (bookable) stations → hare pin
 * publicChargers  — OSM/OCM ke public chargers → neele pin
 * onSearchArea    — "Search this area" dabane par ({lat,lng,radiusKm})
 * lastSearch      — pichli search ka {lat,lng,radiusKm} (button kab dikhana hai)
 */
const StationsMap = ({
  stations,
  publicChargers = [],
  userPos,
  onViewDetails,
  onSearchArea,
  lastSearch,
  searching = false,
  height = 520,
}) => {
  const pinned = useMemo(() => stations.filter(hasCoords), [stations]);
  const missing = stations.length - pinned.length;
  const [area, setArea] = useState(null);

  const points = useMemo(() => {
    const pts = pinned.map((s) => [Number(s.latitude), Number(s.longitude)]);
    if (userPos) pts.push([userPos.lat, userPos.lng]);
    // Na apne stations, na user — to public chargers par fit karo (jaise default Indore)
    if (pts.length === 0) {
      return publicChargers.slice(0, 50).map((c) => [c.latitude, c.longitude]);
    }
    return pts;
  }, [pinned, userPos, publicChargers]);

  // "Search this area" tab dikhao jab zoom theek ho aur map pichli search se kaafi hil gaya ho
  const showSearchBtn =
    onSearchArea &&
    area &&
    area.zoom >= 9 &&
    (!lastSearch ||
      distanceKm(area, lastSearch) > Math.max(1, lastSearch.radiusKm * 0.4) ||
      area.radiusKm > lastSearch.radiusKm * 1.6);

  const tooFar = onSearchArea && area && area.zoom < 9;

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
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
          <FitBounds points={points} />
          {onSearchArea && (
            <AreaWatcher onChange={setArea} />
          )}

          {userPos && (
            <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} zIndexOffset={1000}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {/* Public chargers — neele */}
          {publicChargers.map((c) => {
            const dist = userPos
              ? formatDistance(distanceKm(userPos, { lat: c.latitude, lng: c.longitude }))
              : "";
            return (
              <Marker key={c.id} position={[c.latitude, c.longitude]} icon={publicIcon}>
                <Popup>
                  <div className="snev-popup">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 mb-1.5">
                      Public charger
                    </span>
                    <p className="font-bold text-[15px] text-[#F8FAFC] leading-tight">{c.name}</p>
                    {c.operator && c.operator !== c.name && (
                      <p className="text-xs text-[#94A3B8] mt-0.5">{c.operator}</p>
                    )}
                    {c.address && (
                      <p className="flex items-start gap-1 text-xs text-[#94A3B8] mt-1">
                        <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-amber-300" />
                        <span className="line-clamp-2">{c.address}</span>
                      </p>
                    )}
                    {c.connectors?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.connectors.slice(0, 4).map((k, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-white/[0.1] text-slate-300"
                          >
                            {connectorText(k)}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      {c.maxPowerKW && <span className="text-amber-300 font-semibold">⚡ up to {Math.round(c.maxPowerKW)} kW</span>}
                      {dist && <span className="text-sky-300">{dist} away</span>}
                      {c.isOperational === false && <span className="text-red-300">Not working</span>}
                    </div>
                    <a
                      href={directionsUrl(c.latitude, c.longitude)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300"
                    >
                      <Navigation className="h-3.5 w-3.5" /> Directions
                    </a>
                    <Link
                      to={listChargerUrl(c)}
                      className="mt-2 block text-center text-[11px] font-medium text-cyan-300 hover:underline"
                    >
                      Is this your charger? List it →
                    </Link>
                    <p className="text-[10px] text-slate-500 mt-1">
                      via {(c.sources || [c.source]).join(" + ")} · not bookable on StayNearEV
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Hamare stations — hare, upar */}
          {pinned.map((s) => {
            const pos = { lat: Number(s.latitude), lng: Number(s.longitude) };
            const dist = userPos ? formatDistance(distanceKm(userPos, pos)) : "";
            return (
              <Marker key={s._id} position={[pos.lat, pos.lng]} icon={stationIcon()} zIndexOffset={500}>
                <Popup>
                  <div className="snev-popup">
                    {s.images?.[0] && /^https?:/.test(s.images[0]) && (
                      <img src={s.images[0]} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
                    )}
                    <span
                      className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1.5"
                      style={{ background: `${ACCENT}22`, color: ACCENT }}
                    >
                      Bookable
                    </span>
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
                      {onViewDetails && (
                        <button
                          type="button"
                          onClick={() => onViewDetails(s._id)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-slate-950"
                          style={{ background: ACCENT }}
                        >
                          View &amp; Book
                        </button>
                      )}
                      <a
                        href={directionsUrl(pos.lat, pos.lng)}
                        target="_blank"
                        rel="noreferrer"
                        title="Directions"
                        className={`${onViewDetails ? "px-2.5" : "flex-1 justify-center gap-1.5 text-xs font-semibold"} py-1.5 rounded-lg border border-white/[0.12] text-[#F8FAFC] flex items-center`}
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        {!onViewDetails && "Directions"}
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Search this area */}
        {(showSearchBtn || searching || tooFar) && (
          <div className="absolute z-[500] top-3 left-1/2 -translate-x-1/2">
            {tooFar && !searching ? (
              <span className="px-3.5 py-2 rounded-full text-xs font-medium bg-white/95 text-slate-700 shadow-lg">
                Zoom in to find public chargers
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onSearchArea({ lat: area.lat, lng: area.lng, radiusKm: area.radiusKm })}
                disabled={searching}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-white text-slate-900 shadow-lg hover:bg-slate-50 disabled:opacity-80"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {searching ? "Finding chargers…" : "Search this area"}
              </button>
            )}
          </div>
        )}

        {/* Legend — sirf home map par */}
        {onSearchArea && (
        <div className="absolute z-[500] left-3 bottom-3 flex flex-col gap-1 px-3 py-2 rounded-xl bg-white/95 text-[11px] font-medium text-slate-700 shadow-lg">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: ACCENT }} /> StayNearEV · bookable
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Public charger
            {publicChargers.length > 0 && <b className="ml-0.5">({publicChargers.length})</b>}
          </span>
        </div>
        )}
      </div>

      {missing > 0 && (
        <p className="mt-3 text-xs text-[#94A3B8]">
          {missing} {missing === 1 ? "station has" : "stations have"} no map pin yet — switch to list view to see{" "}
          {missing === 1 ? "it" : "them"}.
        </p>
      )}
    </div>
  );
};

export default StationsMap;
