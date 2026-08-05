import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { stationService } from "../services/stationService";
import { useAuth } from "../context/AuthContext";
import StationCard from "../components/station/StationCard";
import {
  Zap, MapPin, Search, X, RefreshCw, AlertTriangle, PlugZap,
  ChevronLeft, ChevronRight, TrendingUp,
} from "lucide-react";

/* ─── Design tokens ───────────────────────────────────────────────
   bg #020617 · cards #0F172A · borders rgba(255,255,255,.08)
   accent #00E5A8 · hover #06D6A0 · text #F8FAFC · secondary #94A3B8
────────────────────────────────────────────────────────────────── */
const ACCENT = "#00E5A8";
const NAVBAR_CLEARANCE = "pt-28";

const gridStyle = {
  backgroundImage:
    "linear-gradient(rgba(148,163,184,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.025) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
};

const FAST_TYPES = ["ccs2", "chademo", "tesla supercharger", "bharat dc001"];

const isStationAvailable = (s) => {
  if (s.isAvailable === false) return false;
  const status = (s.status || "").toLowerCase();
  return !["inactive", "unavailable", "offline", "maintenance", "closed"].includes(status);
};

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [filters, setFilters] = useState({
    fast: false,
    available: false,
    topRated: false,
    nearby: false,
  });

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [searchTerm, filters]);

  /* Ctrl+K / Cmd+K focuses the search */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await stationService.getAllStations();

      let stationsData = [];
      if (response.data && Array.isArray(response.data.stations)) {
        stationsData = response.data.stations;
      } else if (response.data && Array.isArray(response.data)) {
        stationsData = response.data;
      } else if (Array.isArray(response.stations)) {
        stationsData = response.stations;
      } else if (Array.isArray(response)) {
        stationsData = response;
      }

      setStations(stationsData);
    } catch (err) {
      console.error("Error fetching stations:", err);
      setError("We couldn't load charging stations. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  /* Card click → straight to the station's detail/booking page */
  const handleViewDetails = (stationId) => navigate(`/stations/${stationId}`);
  const handleEdit = (station) => navigate(`/stations/edit/${station._id}`);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await stationService.deleteStation(deleteTarget._id);
      setDeleteTarget(null);
      await fetchStations();
    } catch (err) {
      console.error("Error deleting station:", err);
      setError("Failed to delete the station. Please try again.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const toggleFilter = (key) => setFilters((f) => ({ ...f, [key]: !f[key] }));

  const filteredStations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let list = stations;

    if (q) {
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.location?.toLowerCase().includes(q)
      );
    }
    if (filters.fast) {
      list = list.filter((s) =>
        (s.chargerTypes || []).some((t) => FAST_TYPES.includes(String(t).toLowerCase()))
      );
    }
    if (filters.available) list = list.filter(isStationAvailable);
    if (filters.topRated) {
      list = [...list].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }
    if (filters.nearby) {
      // Placeholder until geolocation is wired up
      list = [...list].sort((a, b) => (a.location || "").localeCompare(b.location || ""));
    }
    return list;
  }, [stations, searchTerm, filters]);

  const availableCount = useMemo(
    () => stations.filter(isStationAvailable).length,
    [stations]
  );
  const availablePct =
    stations.length > 0 ? Math.round((availableCount / stations.length) * 100) : 0;

  const uniqueLocations = useMemo(
    () => new Set(stations.map((s) => s.location).filter(Boolean)).size,
    [stations]
  );

  const avgNetworkRating = useMemo(() => {
    const rated = stations.filter((s) => s.averageRating > 0);
    if (rated.length === 0) return 0;
    return (
      Math.round(
        (rated.reduce((sum, s) => sum + s.averageRating, 0) / rated.length) * 10
      ) / 10
    );
  }, [stations]);

  const isAdmin = user?.role === "admin";
  const isSearching = searchTerm.trim().length > 0;
  const safeIndex = Math.min(activeIndex, Math.max(0, filteredStations.length - 1));

  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const goNext = () =>
    setActiveIndex((i) => Math.min(filteredStations.length - 1, i + 1));

  const canManageStation = () => user?.role === "admin";

  const filterChips = [
    { key: "fast", label: "Fast chargers", emoji: "⚡" },
    { key: "available", label: "Available", emoji: "🟢" },
    { key: "topRated", label: "Highest rated", emoji: "⭐" },
    { key: "nearby", label: "Nearby", emoji: "📍" },
  ];

  /* ────────────────────────────── Loading ────────────────────────────── */
  if (loading) {
    return (
      <div className={`min-h-screen bg-[#020617] ${NAVBAR_CLEARANCE}`} style={gridStyle}>
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center mb-14 pt-6">
            <div>
              <div className="h-7 w-44 bg-slate-800 rounded-full animate-pulse mb-6" />
              <div className="h-12 w-full max-w-md bg-slate-800 rounded-lg animate-pulse mb-4" />
              <div className="h-5 w-3/4 bg-slate-800/70 rounded animate-pulse mb-8" />
              <div className="h-14 w-full max-w-lg bg-slate-800/70 rounded-2xl animate-pulse mb-4" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-9 w-28 bg-slate-800/70 rounded-full animate-pulse" />
                ))}
              </div>
            </div>
            <div className="hidden lg:block h-64 bg-slate-900/50 rounded-3xl animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 max-w-4xl">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-[#0F172A] rounded-2xl border border-white/[0.08] animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#0F172A] rounded-2xl border border-white/[0.08] p-5 animate-pulse">
                <div className="h-32 w-full bg-slate-800 rounded-xl mb-4" />
                <div className="h-5 w-2/3 bg-slate-800 rounded mb-3" />
                <div className="h-4 w-5/6 bg-slate-800/70 rounded mb-4" />
                <div className="h-9 w-full bg-slate-800/70 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────── Error ─────────────────────────────── */
  if (error && stations.length === 0) {
    return (
      <div className={`min-h-screen bg-[#020617] flex items-center justify-center px-4 ${NAVBAR_CLEARANCE}`} style={gridStyle}>
        <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl shadow-xl p-10 text-center max-w-md w-full">
          <div className="bg-red-500/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC] mb-2">Something went wrong</h2>
          <p className="text-[#94A3B8] mb-6">{error}</p>
          <button
            onClick={fetchStations}
            className="inline-flex items-center gap-2 text-slate-950 font-semibold px-6 py-3 rounded-xl transition-all hover:scale-[1.03]"
            style={{ background: ACCENT, boxShadow: `0 8px 24px -8px ${ACCENT}66` }}
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden">
      <div className="absolute inset-0" style={gridStyle} aria-hidden="true" />

      {/* Soft ambient blobs */}
      <div
        className="absolute -top-24 left-[15%] h-[420px] w-[560px] rounded-full opacity-[0.14] blur-[100px] pointer-events-none"
        style={{ background: `radial-gradient(closest-side, ${ACCENT}, transparent)` }}
        aria-hidden="true"
      />
      <div
        className="absolute top-[45%] -right-40 h-96 w-96 rounded-full opacity-[0.08] blur-[100px] pointer-events-none"
        style={{ background: "radial-gradient(closest-side, #3b82f6, transparent)" }}
        aria-hidden="true"
      />

      <div className={`relative max-w-7xl mx-auto px-4 ${NAVBAR_CLEARANCE} pb-20`}>
        {/* ══════════════ HERO ══════════════ */}
        <div className="grid lg:grid-cols-2 gap-10 items-center mb-16 pt-4">
          <div className="text-center lg:text-left">
            <span
              className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] text-sm font-medium px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm"
              style={{ color: ACCENT }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: ACCENT }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: ACCENT }} />
              </span>
              {isAdmin ? "Admin dashboard" : "Live charging network"}
            </span>

            <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold text-[#F8FAFC] tracking-tight mb-5 leading-[1.1]">
              {isAdmin ? (
                <>All charging stations</>
              ) : (
                <>
                  Power your journey,{" "}
                  <span
                    className="text-transparent bg-clip-text"
                    style={{ backgroundImage: `linear-gradient(90deg, ${ACCENT}, #22d3ee)` }}
                  >
                    anywhere
                  </span>
                </>
              )}
            </h1>

            <p className="text-lg text-[#94A3B8] max-w-xl mx-auto lg:mx-0 mb-8">
              {isAdmin
                ? "Monitor and manage every station in the network from one place."
                : "Discover and book electric vehicle charging points near you — fast, reliable, always on."}
            </p>

            {/* Search with Ctrl+K */}
            <div className="max-w-xl mx-auto lg:mx-0 mb-5">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="search"
                  aria-label="Search charging stations"
                  placeholder="Search by station name or location…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-24 py-4 bg-[#0F172A]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl outline-none transition-all shadow-xl shadow-black/40 text-[#F8FAFC] placeholder:text-slate-500 focus:border-[#00E5A8]/60 focus:ring-2 focus:ring-[#00E5A8]/30"
                />
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-white/[0.04] border border-white/[0.08] px-2 py-1 rounded-md pointer-events-none">
                    Ctrl K
                  </kbd>
                )}
              </div>
            </div>

            {/* Quick filters */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              {filterChips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => toggleFilter(chip.key)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all hover:scale-[1.04] ${
                    filters[chip.key]
                      ? "text-slate-950 border-transparent shadow-lg"
                      : "text-[#94A3B8] bg-white/[0.03] border-white/[0.08] hover:text-[#F8FAFC] hover:border-white/20"
                  }`}
                  style={
                    filters[chip.key]
                      ? { background: ACCENT, boxShadow: `0 8px 20px -8px ${ACCENT}80` }
                      : undefined
                  }
                >
                  <span>{chip.emoji}</span>
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: EV illustration */}
          <div className="hidden lg:flex items-center justify-center relative">
            <div
              className="absolute inset-8 rounded-full opacity-25 blur-[80px]"
              style={{ background: `radial-gradient(closest-side, ${ACCENT}, transparent)` }}
              aria-hidden="true"
            />
            <EvIllustration />
          </div>
        </div>

        {/* ══════════════ STATS ══════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14 max-w-5xl">
          <StatCard
            icon={<Zap className="h-6 w-6 text-blue-400" />}
            iconBg="bg-blue-500/10"
            label="Total stations"
            value={stations.length}
            trend="in network"
          />
          <StatCard
            icon={<PlugZap className="h-6 w-6" style={{ color: ACCENT }} />}
            iconBg="bg-[#00E5A8]/10"
            label="Available now"
            value={availableCount}
            trend={`▲ ${availablePct}% uptime`}
            trendAccent
            accent
          />
          <StatCard
            icon={<MapPin className="h-6 w-6 text-violet-400" />}
            iconBg="bg-violet-500/10"
            label="Locations"
            value={uniqueLocations}
            trend={avgNetworkRating > 0 ? `★ ${avgNetworkRating} avg rating` : "cities covered"}
          />
        </div>

        {/* Inline error banner */}
        {error && stations.length > 0 && (
          <div className="mb-6 max-w-3xl flex items-center justify-between gap-4 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl">
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="p-1 hover:bg-red-500/10 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ══════════════ RESULTS ══════════════ */}
        {filteredStations.length === 0 ? (
          <div className="text-center py-20 bg-[#0F172A]/70 backdrop-blur rounded-2xl border border-white/[0.08] max-w-2xl mx-auto shadow-xl">
            <div className="bg-white/[0.04] h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-5">
              <Zap className="h-10 w-10 text-slate-600" />
            </div>
            <p className="text-[#F8FAFC] text-xl font-semibold mb-2">
              {isSearching || Object.values(filters).some(Boolean)
                ? "No stations match"
                : "No charging stations yet"}
            </p>
            <p className="text-[#94A3B8] text-sm mb-6">
              {isSearching
                ? `Nothing found for “${searchTerm}”. Try a different name or location.`
                : Object.values(filters).some(Boolean)
                ? "Try removing some filters."
                : "New stations will appear here as soon as they're added."}
            </p>
            {(isSearching || Object.values(filters).some(Boolean)) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilters({ fast: false, available: false, topRated: false, nearby: false });
                }}
                className="inline-flex items-center gap-2 font-medium hover:underline underline-offset-4"
                style={{ color: ACCENT }}
              >
                Clear search & filters
              </button>
            )}
          </div>
        ) : isSearching ? (
          /* ───────── SEARCH MODE: centered carousel queue ───────── */
          <div>
            <div className="text-center mb-2">
              <p className="text-[#94A3B8] text-sm">
                <span className="font-semibold text-[#F8FAFC]">{filteredStations.length}</span>{" "}
                {filteredStations.length === 1 ? "match" : "matches"} for “
                <span className="font-medium" style={{ color: ACCENT }}>{searchTerm}</span>” — result{" "}
                <span className="font-semibold text-[#F8FAFC]">{safeIndex + 1}</span> of{" "}
                <span className="font-semibold text-[#F8FAFC]">{filteredStations.length}</span>
              </p>
            </div>

            <div className="relative flex items-center justify-center" style={{ minHeight: 500 }}>
              <button
                onClick={goPrev}
                disabled={safeIndex === 0}
                aria-label="Previous station"
                className="absolute left-0 md:left-8 z-30 p-3 rounded-full bg-[#0F172A]/90 border border-white/[0.08] text-[#F8FAFC] transition-all hover:scale-110 hover:border-[#00E5A8]/60 disabled:opacity-30 disabled:pointer-events-none backdrop-blur shadow-xl"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="relative w-full flex items-center justify-center overflow-hidden" style={{ minHeight: 500 }}>
                {filteredStations.map((station, i) => {
                  const offset = i - safeIndex;
                  if (Math.abs(offset) > 2) return null;

                  const scale = offset === 0 ? 1 : Math.abs(offset) === 1 ? 0.85 : 0.72;
                  const opacity = offset === 0 ? 1 : Math.abs(offset) === 1 ? 0.45 : 0.2;
                  const zIndex = 20 - Math.abs(offset);

                  return (
                    <div
                      key={station._id}
                      onClick={() => offset !== 0 && setActiveIndex(i)}
                      className={`absolute w-[320px] max-w-[85vw] transition-all duration-500 ease-out ${
                        offset !== 0 ? "cursor-pointer" : ""
                      }`}
                      style={{
                        transform: `translateX(${offset * 240}px) scale(${scale})`,
                        opacity,
                        zIndex,
                        pointerEvents: Math.abs(offset) > 1 ? "none" : "auto",
                      }}
                    >
                      {offset === 0 && (
                        <div
                          className="absolute -inset-3 rounded-3xl opacity-35 blur-xl pointer-events-none"
                          style={{ background: `radial-gradient(closest-side, ${ACCENT}, transparent)` }}
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative">
                        <StationCard
                          station={station}
                          canManage={canManageStation(station)}
                          userRole={user?.role}
                          onEdit={handleEdit}
                          onDelete={() => setDeleteTarget(station)}
                          onViewDetails={handleViewDetails}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={goNext}
                disabled={safeIndex >= filteredStations.length - 1}
                aria-label="Next station"
                className="absolute right-0 md:right-8 z-30 p-3 rounded-full bg-[#0F172A]/90 border border-white/[0.08] text-[#F8FAFC] transition-all hover:scale-110 hover:border-[#00E5A8]/60 disabled:opacity-30 disabled:pointer-events-none backdrop-blur shadow-xl"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {filteredStations.length > 1 && (
              <div className="flex justify-center gap-2 mt-2">
                {filteredStations.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    aria-label={`Go to result ${i + 1}`}
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: i === safeIndex ? 24 : 8,
                      background: i === safeIndex ? ACCENT : "#1e293b",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ───────── BROWSE MODE: grid ───────── */
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#F8FAFC]">
                {isAdmin ? "Stations" : "Nearby stations"}
              </h2>
              <p className="text-[#94A3B8] text-sm">
                Showing{" "}
                <span className="font-semibold text-[#F8FAFC]">{filteredStations.length}</span>{" "}
                {filteredStations.length === 1 ? "station" : "stations"}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredStations.map((station) => (
                <StationCard
                  key={station._id}
                  station={station}
                  canManage={canManageStation(station)}
                  userRole={user?.role}
                  onEdit={handleEdit}
                  onDelete={() => setDeleteTarget(station)}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ══════════════ DELETE CONFIRMATION MODAL ══════════════ */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) setDeleteTarget(null);
          }}
        >
          <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="bg-red-500/10 h-12 w-12 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h2 id="delete-dialog-title" className="text-lg font-bold text-[#F8FAFC] mb-1">
              Delete this station?
            </h2>
            <p className="text-[#94A3B8] text-sm mb-6">
              <span className="font-medium text-[#F8FAFC]">{deleteTarget.name}</span> will be
              permanently removed. This can't be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-[#94A3B8] font-medium hover:bg-white/[0.04] hover:text-[#F8FAFC] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-all hover:scale-[1.02] disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {deleting && <RefreshCw className="h-4 w-4 animate-spin" />}
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Stat card with real trend line ── */
const StatCard = ({ icon, iconBg, label, value, trend, trendAccent = false, accent = false }) => (
  <div
    className={`bg-[#0F172A]/80 backdrop-blur rounded-2xl p-5 border shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
      accent ? "border-[#00E5A8]/30 hover:border-[#00E5A8]/50" : "border-white/[0.08] hover:border-white/[0.15]"
    }`}
  >
    <div className="flex items-center gap-4">
      <div className={`${iconBg} p-3 rounded-xl shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-[#94A3B8]">{label}</p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-2xl font-bold text-[#F8FAFC] tabular-nums">{value}</p>
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${trendAccent ? "" : "text-slate-500"}`}
              style={trendAccent ? { color: ACCENT } : undefined}
            >
              {trendAccent && <TrendingUp className="h-3 w-3" />}
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

/* ── EV + charger illustration in brand colors ── */
const EvIllustration = () => (
  <svg
    viewBox="0 0 460 300"
    className="relative w-full max-w-md"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <line x1="20" y1="252" x2="440" y2="252" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
    <rect x="330" y="120" width="58" height="130" rx="10" fill="#0F172A" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
    <rect x="341" y="134" width="36" height="26" rx="5" fill="rgba(0,229,168,0.12)" stroke="#00E5A8" strokeWidth="1.5" />
    <path d="M361 138l-6 9h5l-4 9 10-11h-6l4-7z" fill="#00E5A8" />
    <circle cx="359" cy="182" r="4" fill="#00E5A8">
      <animate attributeName="opacity" values="1;0.25;1" dur="1.6s" repeatCount="indefinite" />
    </circle>
    <circle cx="359" cy="198" r="4" fill="rgba(255,255,255,0.15)" />
    <path d="M330 170 C 290 175, 285 205, 258 196" stroke="#00E5A8" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.9" />
    <path
      d="M60 250 h190 a12 12 0 0 0 12-12 v-24 c0-10-6-18-16-21 l-30-8 -28-26 a20 20 0 0 0-14-6 h-70 a18 18 0 0 0-15 8 l-22 30 -14 6 a16 16 0 0 0-10 15 v26 a12 12 0 0 0 12 12 z"
      fill="#0F172A"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="2.5"
    />
    <path d="M120 158 h50 l24 24 h-84 z" fill="rgba(0,229,168,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
    <circle cx="256" cy="196" r="7" fill="#020617" stroke="#00E5A8" strokeWidth="2.5">
      <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
    </circle>
    <circle cx="105" cy="250" r="24" fill="#020617" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
    <circle cx="105" cy="250" r="9" fill="none" stroke="#00E5A8" strokeWidth="2" opacity="0.7" />
    <circle cx="222" cy="250" r="24" fill="#020617" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
    <circle cx="222" cy="250" r="9" fill="none" stroke="#00E5A8" strokeWidth="2" opacity="0.7" />
    <rect x="118" y="96" width="72" height="26" rx="7" fill="#0F172A" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
    <rect x="192" y="103" width="5" height="12" rx="2" fill="rgba(255,255,255,0.2)" />
    <rect x="124" y="102" width="14" height="14" rx="3" fill="#00E5A8" opacity="0.95" />
    <rect x="141" y="102" width="14" height="14" rx="3" fill="#00E5A8" opacity="0.6">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="1.6s" repeatCount="indefinite" />
    </rect>
    <rect x="158" y="102" width="14" height="14" rx="3" fill="rgba(255,255,255,0.08)">
      <animate attributeName="fill" values="rgba(255,255,255,0.08);rgba(0,229,168,0.5);rgba(255,255,255,0.08)" dur="3.2s" repeatCount="indefinite" />
    </rect>
  </svg>
);

export default HomePage;