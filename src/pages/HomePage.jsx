import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { stationService } from "../services/stationService";
import { useAuth } from "../context/AuthContext";
import StationCard from "../components/station/StationCard";
import StationsMap from "../components/map/StationsMap";
import PublicChargerCard from "../components/station/PublicChargerCard";
import Hero3D from "../components/three/Hero3D";
import { useTilt } from "../hooks/useTilt";
import { publicChargerService } from "../services/publicChargerService";
import { hasCoords, distanceKm, getCurrentPosition, DEFAULT_CITY, SHOW_DEMO } from "../utils/geo";
import {
  Zap, MapPin, Search, X, RefreshCw, AlertTriangle, PlugZap,
  ChevronLeft, ChevronRight, TrendingUp, Plus, SlidersHorizontal,
  Map as MapIcon, LayoutGrid,
} from "lucide-react";

/* ─── Design tokens ───────────────────────────────────────────────
   bg #05061A · cards #0E1130 · borders rgba(255,255,255,.08)
   accent #22D3EE · hover #8B5CF6 · text #F8FAFC · secondary #94A3B8
────────────────────────────────────────────────────────────────── */
const ACCENT = "#22D3EE";
const NAVBAR_CLEARANCE = "pt-24 sm:pt-28";

/* Change this if your router uses a different path */
const ADD_STATION_PATH = "/stations/create";

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
  const [isMobile, setIsMobile] = useState(false);
  const [filters, setFilters] = useState({
    fast: false,
    available: false,
    topRated: false,
    nearby: false,
  });
  /* List ya Map view — yaad rakho (per browser) */
  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem("snev:view") === "map" ? "map" : "list";
    } catch {
      return "list";
    }
  });
  const [userPos, setUserPos] = useState(null);
  const [geoBusy, setGeoBusy] = useState(false);

  /* Public chargers (OpenStreetMap + Open Charge Map) */
  const [publicChargers, setPublicChargers] = useState([]);
  const [pcSearch, setPcSearch] = useState(null); // {lat,lng,radiusKm} — pichli search
  const [pcLoading, setPcLoading] = useState(false);
  const [pcError, setPcError] = useState("");
  const [pcShowAll, setPcShowAll] = useState(false);

  const loadPublicChargers = async (area) => {
    setPcLoading(true);
    setPcError("");
    try {
      const data = await publicChargerService.getNearby(area);
      setPublicChargers(data.chargers || []);
      setPcSearch(area);
      setPcShowAll(false);
    } catch (err) {
      console.error("Public chargers error:", err);
      setPcError("Couldn't load public chargers right now. Please try again.");
    } finally {
      setPcLoading(false);
    }
  };

  /* Shuru me default shehar (Indore) ke public chargers — app kabhi khaali na lage */
  useEffect(() => {
    loadPublicChargers({ lat: DEFAULT_CITY.lat, lng: DEFAULT_CITY.lng, radiusKm: 15, city: DEFAULT_CITY.name });
  }, []);

  /* Location milte hi apne aas-paas ke chargers le aao */
  useEffect(() => {
    if (userPos && (!pcSearch || pcSearch.city)) loadPublicChargers({ ...userPos, radiusKm: 15 });
  }, [userPos]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeView = (v) => {
    setView(v);
    try {
      localStorage.setItem("snev:view", v);
    } catch {
      /* private mode — ignore */
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [searchTerm, filters]);

  /* Track viewport so the carousel spacing works on small screens */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = (e) => setIsMobile(e.matches);
    apply(mq);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

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

      // Demo stations sirf local testing me (VITE_SHOW_DEMO=true)
      setStations(SHOW_DEMO ? stationsData : stationsData.filter((s) => !s.isDemo));
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
  const handleAddStation = () => navigate(ADD_STATION_PATH);

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

  /* "Nearby" dabane par user ki location lo */
  const toggleFilter = async (key) => {
    if (key === "nearby" && !filters.nearby && !userPos) {
      setGeoBusy(true);
      try {
        setUserPos(await getCurrentPosition());
      } catch (e) {
        setError(e.message);
        setGeoBusy(false);
        return;
      }
      setGeoBusy(false);
    }
    setFilters((f) => ({ ...f, [key]: !f[key] }));
  };

  const clearAll = () => {
    setSearchTerm("");
    setFilters({ fast: false, available: false, topRated: false, nearby: false });
  };

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
    if (filters.nearby && userPos) {
      // Sabse paas wala pehle; jinka pin nahi wo aakhir me
      const d = (s) =>
        hasCoords(s)
          ? distanceKm(userPos, { lat: Number(s.latitude), lng: Number(s.longitude) })
          : Infinity;
      list = [...list].sort((a, b) => d(a) - d(b));
    }
    return list;
  }, [stations, searchTerm, filters, userPos]);

  /* Card par "2.3 km away" dikhane ke liye */
  const distanceFor = (s) =>
    userPos && hasCoords(s)
      ? distanceKm(userPos, { lat: Number(s.latitude), lng: Number(s.longitude) })
      : null;

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
  /* Har logged-in user apna station list kar sakta hai */
  /* Button sabko dikhe — guest dabaye to login page khulega
     (route guard login ke baad wapas yahi le aata hai) */
  const canAddStation = true;
  const isSearching = searchTerm.trim().length > 0;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const safeIndex = Math.min(activeIndex, Math.max(0, filteredStations.length - 1));

  const goPrev = () => setActiveIndex((i) => Math.max(0, i - 1));
  const goNext = () =>
    setActiveIndex((i) => Math.min(filteredStations.length - 1, i + 1));

  /* Station ka owner id nikalo — createdBy populate hua ho to object,
     warna seedha id string hoti hai */
  const getOwnerId = (station) => {
    const c = station?.createdBy;
    if (!c) return null;
    return typeof c === "object" ? c._id || c.id || null : c;
  };

  const myId = user?._id || user?.id || null;
  const isOwnStation = (station) => Boolean(myId && getOwnerId(station) === myId);

  /* Admin sab manage kare, baaki sirf apna station */
  const canManageStation = (station) => isAdmin || isOwnStation(station);

  const filterChips = [
    { key: "fast", label: "Fast chargers", emoji: "⚡" },
    { key: "available", label: "Available", emoji: "🟢" },
    { key: "topRated", label: "Highest rated", emoji: "⭐" },
    { key: "nearby", label: "Nearby", emoji: "📍" },
  ];

  /* ────────────────────────────── Loading ────────────────────────────── */
  if (loading) {
    return (
      <div className={`min-h-screen bg-[#05061A] ${NAVBAR_CLEARANCE}`} style={gridStyle}>
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center mb-10 sm:mb-14 pt-6">
            <div>
              <div className="h-7 w-44 bg-slate-800 rounded-full animate-pulse mb-5" />
              <div className="h-10 sm:h-12 w-full max-w-md bg-slate-800 rounded-lg animate-pulse mb-4" />
              <div className="h-5 w-3/4 bg-slate-800/70 rounded animate-pulse mb-7" />
              <div className="h-14 w-full max-w-lg bg-slate-800/70 rounded-2xl animate-pulse mb-4" />
              <div className="flex gap-2 overflow-hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-9 w-28 shrink-0 bg-slate-800/70 rounded-full animate-pulse" />
                ))}
              </div>
            </div>
            <div className="hidden lg:block h-64 bg-slate-900/50 rounded-3xl animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-10 sm:mb-12 max-w-4xl">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 sm:h-28 bg-[#0E1130] rounded-2xl border border-white/[0.08] animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#0E1130] rounded-2xl border border-white/[0.08] p-5 animate-pulse">
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
      <div className={`min-h-screen bg-[#05061A] flex items-center justify-center px-4 ${NAVBAR_CLEARANCE}`} style={gridStyle}>
        <div className="bg-[#0E1130] border border-white/[0.08] rounded-2xl shadow-xl p-8 sm:p-10 text-center max-w-md w-full">
          <div className="bg-red-500/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC] mb-2">Something went wrong</h2>
          <p className="text-[#94A3B8] mb-6">{error}</p>
          <button
            onClick={fetchStations}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto text-slate-950 font-semibold px-6 py-3 rounded-xl transition-all active:scale-95 sm:hover:scale-[1.03]"
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
    <div className="min-h-screen w-full bg-[#05061A] relative">
      {/* Background layer — apne andar clip hota hai, isliye blobs
          page ki width kabhi nahi badha sakte. Pehle ye root par
          overflow-x-hidden se handle ho raha tha, jo overflow-y
          visible ke saath invalid tha aur clipping tod deta tha. */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0" style={gridStyle} />
        <div
          className="absolute -top-24 left-[10%] h-[420px] w-[70vw] max-w-[560px] rounded-full opacity-[0.14] blur-[100px]"
          style={{ background: `radial-gradient(closest-side, ${ACCENT}, transparent)` }}
        />
        <div
          className="absolute top-[45%] right-0 h-96 w-[60vw] max-w-96 rounded-full opacity-[0.08] blur-[100px]"
          style={{ background: "radial-gradient(closest-side, #3b82f6, transparent)" }}
        />
      </div>

      <div className={`relative w-full max-w-7xl mx-auto px-4 ${NAVBAR_CLEARANCE} pb-36 sm:pb-24`}>
        {/* ══════════════ HERO ══════════════ */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-center mb-12 sm:mb-16 pt-2 sm:pt-4">
          <div className="text-center lg:text-left min-w-0 order-last lg:order-first">
            <span
              className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full mb-4 sm:mb-6 backdrop-blur-sm"
              style={{ color: ACCENT }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: ACCENT }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: ACCENT }} />
              </span>
              {isAdmin ? "Admin dashboard" : "Live charging network"}
            </span>

            <h1 className="text-[1.9rem] leading-[1.2] sm:text-5xl xl:text-6xl font-bold text-[#F8FAFC] tracking-tight mb-4 sm:mb-5 sm:leading-[1.1] break-words hyphens-none">
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

            <p className="text-[15px] sm:text-lg text-[#94A3B8] max-w-xl mx-auto lg:mx-0 mb-7 sm:mb-8 break-words">
              {isAdmin
                ? "Monitor and manage every station in the network from one place."
                : "Find and book EV charging points near you — fast, reliable, always on."}
            </p>

            {/* Primary add button (full width on mobile) */}
            {canAddStation && (
              <div className="mb-5">
                <button
                  onClick={handleAddStation}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 text-slate-950 font-semibold px-6 py-3.5 rounded-2xl transition-all active:scale-[0.97] sm:hover:scale-[1.03]"
                  style={{ background: ACCENT, boxShadow: `0 8px 24px -8px ${ACCENT}66` }}
                >
                  <Plus className="h-5 w-5" />
                  Add station
                </button>
              </div>
            )}

            {/* Search with Ctrl+K */}
            <div className="max-w-xl mx-auto lg:mx-0 mb-4 sm:mb-5">
              <div className="relative group">
                <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  aria-label="Search charging stations"
                  placeholder="Search station or location…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 sm:pl-14 pr-12 sm:pr-24 py-3.5 sm:py-4 text-base bg-[#0E1130]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl outline-none transition-all shadow-xl shadow-black/40 text-[#F8FAFC] placeholder:text-slate-500 focus:border-[#22D3EE]/60 focus:ring-2 focus:ring-[#22D3EE]/30"
                />
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] rounded-full transition-colors"
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

            {/* Quick filters — horizontal scroll on mobile, wrap on desktop */}
            <div className="w-full max-w-full overflow-hidden">
              <div className="flex sm:flex-wrap justify-start lg:justify-start gap-2 overflow-x-auto sm:overflow-visible pb-1 no-scrollbar snap-x">
                {filterChips.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={() => toggleFilter(chip.key)}
                    aria-pressed={filters[chip.key]}
                    className={`shrink-0 snap-start inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-full text-sm font-medium border transition-all active:scale-95 sm:hover:scale-[1.04] ${
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
                    {chip.key === "nearby" && geoBusy ? "Locating…" : chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active filter summary (mobile-friendly reset) */}
            {(activeFilterCount > 0 || isSearching) && (
              <button
                onClick={clearAll}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {activeFilterCount > 0
                  ? `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} on`
                  : "Search on"}
                <span className="mx-1 text-slate-600">·</span>
                <span style={{ color: ACCENT }}>Clear</span>
              </button>
            )}
          </div>

          {/* EV illustration — mobile par hero ke upar, desktop par right side */}
          <div className="flex items-center justify-center relative order-first lg:order-last mb-2 lg:mb-0">
            <div
              className="absolute inset-6 sm:inset-8 rounded-full opacity-25 blur-[80px]"
              style={{ background: `radial-gradient(closest-side, ${ACCENT}, transparent)` }}
              aria-hidden="true"
            />
            <Hero3D
              fallback={<EvIllustration />}
              className="w-full h-[280px] sm:h-[360px] lg:h-[460px]"
            />
          </div>
        </div>

        {/* ══════════════ STATS ══════════════ */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-12 sm:mb-14 max-w-5xl">
          <StatCard
            icon={<Zap className="h-5 w-5 sm:h-6 sm:w-6 text-violet-400" />}
            iconBg="bg-violet-500/10"
            label="Stations"
            fullLabel="Total stations"
            value={stations.length}
            trend="in network"
          />
          <StatCard
            icon={<PlugZap className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: ACCENT }} />}
            iconBg="bg-[#22D3EE]/10"
            label="Available"
            fullLabel="Available now"
            value={availableCount}
            trend={`▲ ${availablePct}% uptime`}
            trendAccent
            accent
          />
          <StatCard
            icon={<MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-violet-400" />}
            iconBg="bg-violet-500/10"
            label="Locations"
            fullLabel="Locations"
            value={uniqueLocations}
            trend={avgNetworkRating > 0 ? `★ ${avgNetworkRating} avg` : "cities covered"}
          />
        </div>

        {/* Inline error banner */}
        {error && stations.length > 0 && (
          <div className="mb-6 max-w-3xl flex items-center justify-between gap-4 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl">
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="p-1 hover:bg-red-500/10 rounded-full transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ══════════════ VIEW TOGGLE: List / Map ══════════════ */}
        {(
          <div className="flex items-center justify-end gap-2 mb-4">
            {view === "map" && !userPos && (
              <button
                onClick={() => toggleFilter("nearby")}
                disabled={geoBusy}
                className="mr-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-sky-300 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/15 disabled:opacity-60"
              >
                📍 {geoBusy ? "Locating…" : "Show my location"}
              </button>
            )}
            <div
              role="tablist"
              aria-label="Choose view"
              className="inline-flex p-1 rounded-xl bg-[#0E1130]/80 border border-white/[0.08] backdrop-blur"
            >
              {[
                { key: "list", label: "List", Icon: LayoutGrid },
                { key: "map", label: "Map", Icon: MapIcon },
              ].map((tab) => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={view === tab.key}
                  onClick={() => changeView(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    view === tab.key ? "text-slate-950" : "text-[#94A3B8] hover:text-[#F8FAFC]"
                  }`}
                  style={view === tab.key ? { background: ACCENT } : undefined}
                >
                  <tab.Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════ RESULTS ══════════════ */}
        {filteredStations.length === 0 && view !== "map" ? (
          <div className="text-center py-14 sm:py-20 px-5 bg-[#0E1130]/70 backdrop-blur rounded-2xl border border-white/[0.08] max-w-2xl mx-auto shadow-xl">
            <div className="bg-white/[0.04] h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center mx-auto mb-5">
              <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-slate-600" />
            </div>
            <p className="text-[#F8FAFC] text-lg sm:text-xl font-semibold mb-2">
              {isSearching || activeFilterCount > 0
                ? "No stations match"
                : "No charging stations yet"}
            </p>
            <p className="text-[#94A3B8] text-sm mb-6">
              {isSearching
                ? `Nothing found for “${searchTerm}”. Try a different name or location.`
                : activeFilterCount > 0
                ? "Try removing some filters."
                : canAddStation
                ? "List your charging station and start taking bookings."
                : "New stations will appear here as soon as they're added."}
            </p>

            {isSearching || activeFilterCount > 0 ? (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-2 font-medium hover:underline underline-offset-4"
                style={{ color: ACCENT }}
              >
                Clear search & filters
              </button>
            ) : (
              canAddStation && (
                <button
                  onClick={handleAddStation}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 text-slate-950 font-semibold px-6 py-3.5 rounded-2xl transition-all active:scale-[0.97] sm:hover:scale-[1.03]"
                  style={{ background: ACCENT, boxShadow: `0 8px 24px -8px ${ACCENT}66` }}
                >
                  <Plus className="h-5 w-5" />
                  Add station
                </button>
              )
            )}
          </div>
        ) : view === "map" ? (
          /* ───────── MAP MODE ───────── */
          <StationsMap
            stations={filteredStations}
            publicChargers={publicChargers}
            userPos={userPos}
            onViewDetails={handleViewDetails}
            onSearchArea={loadPublicChargers}
            lastSearch={pcSearch}
            searching={pcLoading}
            height={isMobile ? 480 : 600}
          />
        ) : isSearching ? (
          /* ───────── SEARCH MODE: centered carousel queue ───────── */
          <div>
            <div className="text-center mb-2 px-2">
              <p className="text-[#94A3B8] text-xs sm:text-sm">
                <span className="font-semibold text-[#F8FAFC]">{filteredStations.length}</span>{" "}
                {filteredStations.length === 1 ? "match" : "matches"} for “
                <span className="font-medium" style={{ color: ACCENT }}>{searchTerm}</span>” —{" "}
                <span className="font-semibold text-[#F8FAFC]">{safeIndex + 1}</span> of{" "}
                <span className="font-semibold text-[#F8FAFC]">{filteredStations.length}</span>
              </p>
            </div>

            <div
              className="relative flex items-center justify-center"
              style={{ minHeight: isMobile ? 440 : 500 }}
            >
              <button
                onClick={goPrev}
                disabled={safeIndex === 0}
                aria-label="Previous station"
                className="absolute left-0 md:left-8 z-30 p-2.5 sm:p-3 rounded-full bg-[#0E1130]/90 border border-white/[0.08] text-[#F8FAFC] transition-all active:scale-95 sm:hover:scale-110 hover:border-[#22D3EE]/60 disabled:opacity-30 disabled:pointer-events-none backdrop-blur shadow-xl"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div
                className="relative w-full flex items-center justify-center overflow-hidden"
                style={{ minHeight: isMobile ? 440 : 500 }}
              >
                {filteredStations.map((station, i) => {
                  const offset = i - safeIndex;
                  const maxVisible = isMobile ? 1 : 2;
                  if (Math.abs(offset) > maxVisible) return null;

                  const scale = offset === 0 ? 1 : Math.abs(offset) === 1 ? 0.85 : 0.72;
                  const opacity = offset === 0 ? 1 : Math.abs(offset) === 1 ? 0.4 : 0.2;
                  const zIndex = 20 - Math.abs(offset);
                  const shift = isMobile ? 150 : 240;

                  return (
                    <div
                      key={station._id}
                      onClick={() => offset !== 0 && setActiveIndex(i)}
                      className={`absolute w-[300px] sm:w-[320px] max-w-[80vw] transition-all duration-500 ease-out ${
                        offset !== 0 ? "cursor-pointer" : ""
                      }`}
                      style={{
                        transform: `translateX(${offset * shift}px) scale(${scale})`,
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
                          isOwn={isOwnStation(station)}
                          onEdit={handleEdit}
                          onDelete={() => setDeleteTarget(station)}
                          onViewDetails={handleViewDetails}
                          distanceKm={distanceFor(station)}
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
                className="absolute right-0 md:right-8 z-30 p-2.5 sm:p-3 rounded-full bg-[#0E1130]/90 border border-white/[0.08] text-[#F8FAFC] transition-all active:scale-95 sm:hover:scale-110 hover:border-[#22D3EE]/60 disabled:opacity-30 disabled:pointer-events-none backdrop-blur shadow-xl"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {filteredStations.length > 1 && (
              <div className="flex justify-center flex-wrap gap-2 mt-2 px-4">
                {filteredStations.slice(0, 12).map((_, i) => (
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
            <div className="mb-5 sm:mb-6 flex items-center justify-between gap-3">
              <h2 className="text-base sm:text-lg font-semibold text-[#F8FAFC]">
                {isAdmin ? "Stations" : "Nearby stations"}
              </h2>
              <p className="text-[#94A3B8] text-xs sm:text-sm shrink-0">
                <span className="font-semibold text-[#F8FAFC]">{filteredStations.length}</span>{" "}
                {filteredStations.length === 1 ? "station" : "stations"}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredStations.map((station) => (
                <StationCard
                  key={station._id}
                  station={station}
                  canManage={canManageStation(station)}
                  isOwn={isOwnStation(station)}
                  onEdit={handleEdit}
                  onDelete={() => setDeleteTarget(station)}
                  onViewDetails={handleViewDetails}
                  distanceKm={distanceFor(station)}
                />
              ))}
            </div>
          </>
        )}

        {/* ══════════════ PUBLIC CHARGERS (list view) ══════════════ */}
        {view === "list" && (
          <section className="mt-12 sm:mt-14">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-[#F8FAFC] flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  {pcSearch?.city ? `Public charging points in ${pcSearch.city}` : "Public charging points near you"}
                </h2>
                <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
                  Other EV chargers (Tata Power, Statiq, ChargeZone…). Not bookable here, but you can get directions.
                  {pcSearch?.city && !userPos && (
                    <>
                      {" "}
                      <button
                        onClick={() => toggleFilter("nearby")}
                        disabled={geoBusy}
                        className="font-semibold text-amber-300 hover:underline disabled:opacity-60"
                      >
                        📍 {geoBusy ? "Locating…" : "Show chargers near me"}
                      </button>
                    </>
                  )}
                </p>
              </div>
              {publicChargers.length > 0 && (
                <p className="text-[#94A3B8] text-xs sm:text-sm shrink-0">
                  <span className="font-semibold text-[#F8FAFC]">{publicChargers.length}</span> found
                </p>
              )}
            </div>

            {pcLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-56 bg-[#0E1130] rounded-2xl border border-white/[0.06] animate-pulse" />
                ))}
              </div>
            ) : publicChargers.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {(pcShowAll ? publicChargers : publicChargers.slice(0, 8)).map((c) => (
                    <PublicChargerCard
                      key={c.id}
                      charger={c}
                      distanceKm={
                        userPos ? distanceKm(userPos, { lat: c.latitude, lng: c.longitude }) : null
                      }
                    />
                  ))}
                </div>
                {!pcShowAll && publicChargers.length > 8 && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => setPcShowAll(true)}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500/10"
                    >
                      Show all {publicChargers.length} chargers
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4 p-5 sm:p-6 rounded-2xl border border-dashed border-amber-500/25 bg-amber-500/[0.04]">
                <span className="h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center bg-amber-500/10">
                  <PlugZap className="h-6 w-6 text-amber-300" />
                </span>
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-semibold text-[#F8FAFC]">
                    {pcSearch ? "No public chargers found in this area" : "See every EV charger around you"}
                  </p>
                  <p className="text-sm text-[#94A3B8]">
                    {pcError ||
                      (pcSearch
                        ? "Try the map and search a bigger area."
                        : "Allow location and we'll show public charging points within 15 km.")}
                  </p>
                </div>
                <button
                  onClick={() =>
                    userPos ? loadPublicChargers({ ...userPos, radiusKm: 15 }) : toggleFilter("nearby")
                  }
                  disabled={geoBusy}
                  className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-60"
                >
                  📍 {geoBusy ? "Locating…" : userPos ? "Try again" : "Find chargers near me"}
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {/* ══════════════ MOBILE FLOATING ADD BUTTON ══════════════ */}
      {canAddStation && (
        <button
          onClick={handleAddStation}
          aria-label="Add station"
          className="sm:hidden fixed right-5 z-40 h-14 w-14 rounded-full flex items-center justify-center text-slate-950 transition-transform active:scale-90"
          style={{
            bottom: "calc(1.5rem + env(safe-area-inset-bottom))",
            background: ACCENT,
            boxShadow: `0 12px 32px -6px ${ACCENT}99`,
          }}
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </button>
      )}

      {/* ══════════════ DELETE CONFIRMATION MODAL ══════════════ */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) setDeleteTarget(null);
          }}
        >
          <div
            className="bg-[#0E1130] border border-white/[0.08] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-6"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <div className="sm:hidden mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" />
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
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-3 rounded-xl border border-white/[0.08] text-[#94A3B8] font-medium hover:bg-white/[0.04] hover:text-[#F8FAFC] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-all active:scale-[0.98] disabled:opacity-50 inline-flex items-center justify-center gap-2"
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

/* ── Stat card: stacked on mobile, horizontal on desktop ── */
const StatCard = ({ icon, iconBg, label, fullLabel, value, trend, trendAccent = false, accent = false }) => {
  const tilt = useTilt({ max: 10 });
  return (
  <div
    ref={tilt.ref}
    onPointerMove={tilt.onPointerMove}
    onPointerLeave={tilt.onPointerLeave}
    className={`snev-tilt relative overflow-hidden bg-[#0E1130]/80 backdrop-blur rounded-2xl p-3.5 sm:p-5 border shadow-xl transition-[box-shadow,border-color] duration-300 sm:hover:shadow-2xl ${
      accent ? "border-[#22D3EE]/30 hover:border-[#22D3EE]/50" : "border-white/[0.08] hover:border-white/[0.15]"
    }`}
  >
    <span className="snev-glare" aria-hidden="true" />
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <div className={`${iconBg} p-2 sm:p-3 rounded-xl w-fit shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-[#94A3B8] truncate">
          <span className="sm:hidden">{label}</span>
          <span className="hidden sm:inline">{fullLabel || label}</span>
        </p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-xl sm:text-2xl font-bold text-[#F8FAFC] tabular-nums">{value}</p>
          {trend && (
            <span
              className={`hidden sm:inline-flex items-center gap-0.5 text-[11px] font-medium ${trendAccent ? "" : "text-slate-500"}`}
              style={trendAccent ? { color: ACCENT } : undefined}
            >
              {trendAccent && <TrendingUp className="h-3 w-3" />}
              {trend}
            </span>
          )}
        </div>
        {trend && (
          <span
            className={`sm:hidden block text-[10px] font-medium truncate ${trendAccent ? "" : "text-slate-500"}`}
            style={trendAccent ? { color: ACCENT } : undefined}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  </div>
  );
};

/* ── EV + charger illustration in brand colors ── */
const EvIllustration = () => (
  <svg
    viewBox="0 0 460 300"
    className="relative w-full max-w-[300px] sm:max-w-sm lg:max-w-md"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <line x1="20" y1="252" x2="440" y2="252" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" />
    <rect x="330" y="120" width="58" height="130" rx="10" fill="#0E1130" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
    <rect x="341" y="134" width="36" height="26" rx="5" fill="rgba(0,229,168,0.12)" stroke="#22D3EE" strokeWidth="1.5" />
    <path d="M361 138l-6 9h5l-4 9 10-11h-6l4-7z" fill="#22D3EE" />
    <circle cx="359" cy="182" r="4" fill="#22D3EE">
      <animate attributeName="opacity" values="1;0.25;1" dur="1.6s" repeatCount="indefinite" />
    </circle>
    <circle cx="359" cy="198" r="4" fill="rgba(255,255,255,0.15)" />
    <path d="M330 170 C 290 175, 285 205, 258 196" stroke="#22D3EE" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.9" />
    <path
      d="M60 250 h190 a12 12 0 0 0 12-12 v-24 c0-10-6-18-16-21 l-30-8 -28-26 a20 20 0 0 0-14-6 h-70 a18 18 0 0 0-15 8 l-22 30 -14 6 a16 16 0 0 0-10 15 v26 a12 12 0 0 0 12 12 z"
      fill="#0E1130"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="2.5"
    />
    <path d="M120 158 h50 l24 24 h-84 z" fill="rgba(0,229,168,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
    <circle cx="256" cy="196" r="7" fill="#05061A" stroke="#22D3EE" strokeWidth="2.5">
      <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
    </circle>
    <circle cx="105" cy="250" r="24" fill="#05061A" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
    <circle cx="105" cy="250" r="9" fill="none" stroke="#22D3EE" strokeWidth="2" opacity="0.7" />
    <circle cx="222" cy="250" r="24" fill="#05061A" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
    <circle cx="222" cy="250" r="9" fill="none" stroke="#22D3EE" strokeWidth="2" opacity="0.7" />
    <rect x="118" y="96" width="72" height="26" rx="7" fill="#0E1130" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
    <rect x="192" y="103" width="5" height="12" rx="2" fill="rgba(255,255,255,0.2)" />
    <rect x="124" y="102" width="14" height="14" rx="3" fill="#22D3EE" opacity="0.95" />
    <rect x="141" y="102" width="14" height="14" rx="3" fill="#22D3EE" opacity="0.6">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="1.6s" repeatCount="indefinite" />
    </rect>
    <rect x="158" y="102" width="14" height="14" rx="3" fill="rgba(255,255,255,0.08)">
      <animate attributeName="fill" values="rgba(255,255,255,0.08);rgba(0,229,168,0.5);rgba(255,255,255,0.08)" dur="3.2s" repeatCount="indefinite" />
    </rect>
  </svg>
);

export default HomePage;