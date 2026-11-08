import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Navigation, Zap, PlugZap } from "lucide-react";
import { directionsUrl, formatDistance, listChargerUrl } from "../../utils/geo";

/* Public charger (OpenStreetMap / Open Charge Map) ka card — booking nahi, sirf directions */
const PublicChargerCard = ({ charger, distanceKm }) => {
  const c = charger;
  const dist = distanceKm; // sirf jab user ki location pata ho

  return (
    <div className="group flex flex-col bg-[#0F172A]/80 backdrop-blur rounded-2xl border border-blue-500/15 hover:border-blue-400/40 p-4 sm:p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-950/40">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20">
          <PlugZap className="h-5 w-5 text-blue-300" />
        </span>
        {dist != null && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-300 bg-sky-500/10 px-2 py-1 rounded-lg">
            <Navigation className="h-3 w-3" />
            {formatDistance(dist)}
          </span>
        )}
      </div>

      <h3 className="font-semibold text-[#F8FAFC] leading-snug line-clamp-2">{c.name}</h3>
      {c.operator && c.operator !== c.name && (
        <p className="text-xs text-[#94A3B8] mt-0.5 line-clamp-1">{c.operator}</p>
      )}
      {c.address && (
        <p className="flex items-start gap-1.5 text-xs text-[#94A3B8] mt-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 mt-px text-blue-300" />
          <span className="line-clamp-2">{c.address}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-3">
        {(c.connectors || []).slice(0, 3).map((k, i) => (
          <span
            key={i}
            className="text-[11px] font-medium px-2 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.03] text-slate-300"
          >
            {k.type}
            {k.powerKW ? ` · ${Math.round(k.powerKW)} kW` : ""}
          </span>
        ))}
        {!c.connectors?.length && <span className="text-[11px] text-slate-500">Connector info not available</span>}
      </div>

      <div className="flex items-center gap-3 mt-3 text-xs">
        {c.maxPowerKW && (
          <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
            <Zap className="h-3.5 w-3.5" /> up to {Math.round(c.maxPowerKW)} kW
          </span>
        )}
        {c.capacity && <span className="text-[#94A3B8]">{c.capacity} points</span>}
        {c.isOperational === false && <span className="text-red-300">Not working</span>}
      </div>

      <div className="mt-auto pt-4">
        <a
          href={directionsUrl(c.latitude, c.longitude)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
        >
          <Navigation className="h-4 w-4" />
          Directions
        </a>
        <Link
          to={listChargerUrl(c)}
          className="mt-2 block text-center text-xs font-medium text-emerald-300/90 hover:text-emerald-300 hover:underline underline-offset-2"
        >
          Is this your charger? List it on StayNearEV →
        </Link>
        <p className="text-[10px] text-slate-500 text-center mt-1.5">
          Public charger · via {(c.sources || [c.source]).join(" + ")}
        </p>
      </div>
    </div>
  );
};

export default PublicChargerCard;
