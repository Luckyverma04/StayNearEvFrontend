import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { Crosshair, Search, X, MapPin } from "lucide-react";
import { stationIcon, TILE_URL, TILE_ATTRIBUTION } from "./mapIcons";
import { getCurrentPosition, DEFAULT_CENTER } from "../../utils/geo";

const ACCENT = "#22D3EE";

/* Map par click → pin wahan */
const ClickToPlace = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
};

/* Pin badle to map waha le jao */
const FlyTo = ({ pos, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo([pos.lat, pos.lng], Math.max(map.getZoom(), zoom), { duration: 0.6 });
  }, [map, pos, zoom]);
  return null;
};

/**
 * Station ki location map se chuno.
 * value: { lat, lng } | null
 * onChange(value)
 * onAddressFound(text) — search se mili jagah ka naam (optional)
 */
const LocationPicker = ({ value, onChange, onAddressFound, height = 300 }) => {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const start = useMemo(() => value || DEFAULT_CENTER, []); // eslint-disable-line react-hooks/exhaustive-deps

  const useMyLocation = async () => {
    setMsg("");
    setBusy(true);
    try {
      onChange(await getCurrentPosition());
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  // Address search — OpenStreetMap Nominatim (free, koi key nahi)
  const search = async (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setMsg("");
    setBusy(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await res.json();
      if (!data?.length) {
        setMsg("Place not found. Try a nearby landmark, or tap on the map.");
        return;
      }
      onChange({ lat: Number(data[0].lat), lng: Number(data[0].lon) });
      onAddressFound?.(data[0].display_name);
    } catch {
      setMsg("Search failed. Tap on the map to place the pin instead.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search(e)}
            placeholder="Search area, e.g. Vijay Nagar Indore"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#05061A]/60 border border-white/[0.1] text-sm text-[#F8FAFC] placeholder:text-slate-600 outline-none focus:border-[#22D3EE]/70"
          />
        </div>
        <button
          type="button"
          onClick={search}
          disabled={busy || !query.trim()}
          className="px-3.5 rounded-xl text-sm font-semibold border border-white/[0.12] text-[#F8FAFC] hover:bg-white/[0.06] disabled:opacity-40"
        >
          Search
        </button>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-white/[0.1] snev-map" style={{ height }}>
        <MapContainer
          center={[start.lat, start.lng]}
          zoom={value ? 15 : 5}
          scrollWheelZoom
          style={{ height: "100%", width: "100%", background: "#e8eef3", cursor: "crosshair" }}
        >
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
          <ClickToPlace onPick={onChange} />
          <FlyTo pos={value} zoom={15} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={stationIcon()}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const p = e.target.getLatLng();
                  onChange({ lat: p.lat, lng: p.lng });
                },
              }}
            />
          )}
        </MapContainer>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={busy}
          className="absolute z-[500] right-3 bottom-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-950 shadow-lg disabled:opacity-60"
          style={{ background: ACCENT }}
        >
          <Crosshair className="h-4 w-4" />
          {busy ? "Locating…" : "Use my location"}
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        {value ? (
          <span className="inline-flex items-center gap-1.5 text-[#94A3B8]">
            <MapPin className="h-3.5 w-3.5" style={{ color: ACCENT }} />
            Pin set at {value.lat.toFixed(5)}, {value.lng.toFixed(5)} — drag to adjust
          </span>
        ) : (
          <span className="text-[#94A3B8]">Tap the map, search, or use your location to drop a pin.</span>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-red-300"
          >
            <X className="h-3.5 w-3.5" /> Remove pin
          </button>
        )}
      </div>
      {msg && <p className="text-xs text-amber-300">{msg}</p>}
    </div>
  );
};

export default LocationPicker;
