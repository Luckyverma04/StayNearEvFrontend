import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, Calendar, Pencil, Check, X, Zap, MapPin, Plus, CalendarCheck, BookOpen,
  ShieldCheck, Trash2, AlertTriangle, ChevronRight, Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { bookingService } from "../services/bookingService";
import { stationService } from "../services/stationService";

const ACCENT = "#22D3EE";
const gridStyle = {
  backgroundImage:
    "linear-gradient(rgba(148,163,184,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.025) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
};

// Response ka shape kuch bhi ho — array nikaal lo
const toArray = (res, key) => {
  const d = res?.data ?? res;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.[key])) return d[key];
  if (Array.isArray(res?.[key])) return res[key];
  return [];
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-[#0E1130]/80 backdrop-blur border border-white/[0.08] rounded-2xl ${className}`}>{children}</div>
);

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null); // server se poora user (createdAt, googleId…)
  const [bookings, setBookings] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const myId = user?._id || user?.id;

  useEffect(() => {
    let alive = true;
    (async () => {
      const [p, b, s] = await Promise.allSettled([
        authService.getProfile(),
        bookingService.getUserBookings(),
        stationService.getAllStations(),
      ]);
      if (!alive) return;
      if (p.status === "fulfilled") setProfile(p.value?.data?.user || p.value?.data || null);
      if (b.status === "fulfilled") setBookings(toArray(b.value, "bookings"));
      if (s.status === "fulfilled") {
        const all = toArray(s.value, "stations");
        setStations(
          all.filter((st) => {
            const c = st.createdBy;
            const id = c && typeof c === "object" ? c._id || c.id : c;
            return id && String(id) === String(myId);
          })
        );
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [myId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const info = { ...user, ...profile };
  const isGoogle = Boolean(info.googleId);
  const joined = info.createdAt
    ? new Date(info.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const stats = useMemo(() => {
    const now = Date.now();
    const upcoming = bookings.filter(
      (b) => ["pending", "confirmed", "active"].includes(b.status) && new Date(b.endTime || b.startTime) > now
    ).length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    return { total: bookings.length, upcoming, completed };
  }, [bookings]);

  const saveName = async () => {
    const clean = name.trim().replace(/\s+/g, " ");
    if (clean.length < 2 || clean.length > 50) {
      setToast({ type: "error", text: "Name must be 2 to 50 characters." });
      return;
    }
    setSaving(true);
    try {
      const res = await authService.updateProfile({ name: clean });
      updateUser({ name: res.data?.name || clean });
      setProfile((p) => ({ ...(p || {}), name: res.data?.name || clean }));
      setEditing(false);
      setToast({ type: "success", text: "Name updated." });
    } catch (err) {
      setToast({ type: "error", text: err.response?.data?.message || "Couldn't update name." });
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await authService.deleteMyAccount();
      // Token hatao aur Home ko poora reload karo — saari purani state saaf.
      // (Pehle logout karte to profile ka login-guard /login par bhej deta.)
      authService.logout();
      window.location.replace("/");
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Couldn't delete account. Please try again.");
      setDeleting(false);
    }
  };

  const avatar = info.avatar ? (
    <img
      src={info.avatar}
      alt=""
      referrerPolicy="no-referrer"
      className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover ring-2 ring-[#22D3EE]/40"
    />
  ) : (
    <div
      className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl flex items-center justify-center text-slate-950 text-3xl sm:text-4xl font-bold"
      style={{ background: `linear-gradient(135deg, ${ACCENT}, #8B5CF6)` }}
    >
      {info.name?.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05061A] relative pt-24 sm:pt-28">
      <div className="absolute inset-0 pointer-events-none" style={gridStyle} aria-hidden="true" />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-[320px] w-[640px] max-w-full rounded-full opacity-[0.12] blur-[100px] pointer-events-none"
        style={{ background: `radial-gradient(closest-side, ${ACCENT}, transparent)` }}
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto px-4 pb-20 space-y-6">
        {/* ── Header ── */}
        <Card className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {avatar}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveName();
                      if (e.key === "Escape") setEditing(false);
                    }}
                    maxLength={50}
                    aria-label="Your name"
                    className="flex-1 min-w-[180px] px-3 py-2 rounded-xl bg-[#05061A]/60 border border-[#22D3EE]/50 text-xl font-bold text-[#F8FAFC] outline-none focus:ring-4 focus:ring-[#22D3EE]/10"
                  />
                  <button
                    onClick={saveName}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-950 disabled:opacity-60"
                    style={{ background: ACCENT }}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setName(info.name || "");
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]"
                    aria-label="Cancel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] truncate">{info.name}</h1>
                  <button
                    onClick={() => {
                      setName(info.name || "");
                      setEditing(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#22D3EE] hover:bg-white/[0.06]"
                    aria-label="Edit name"
                    title="Edit name"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              )}

              <p className="flex items-center gap-2 text-[#94A3B8] mt-1.5 text-sm">
                <Mail className="h-4 w-4 shrink-0" /> <span className="truncate">{info.email}</span>
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-slate-300">
                  {isGoogle ? (
                    <>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      Google account
                    </>
                  ) : (
                    <>
                      <Mail className="h-3.5 w-3.5" /> Email &amp; password
                    </>
                  )}
                </span>
                {info.isEmailVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                )}
                {joined && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.05] border border-white/[0.08] text-slate-400">
                    <Calendar className="h-3.5 w-3.5" /> Joined {joined}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Bookings", value: stats.total, to: "/my-bookings" },
            { label: "Upcoming", value: stats.upcoming, to: "/my-bookings" },
            { label: "Completed", value: stats.completed, to: "/my-bookings" },
            { label: "My stations", value: stations.length, to: "#stations" },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() =>
                s.to.startsWith("#")
                  ? document.getElementById("stations")?.scrollIntoView({ behavior: "smooth" })
                  : navigate(s.to)
              }
              className="text-left p-4 rounded-2xl border border-white/[0.08] bg-[#0E1130]/80 hover:border-[#22D3EE]/40 transition-colors"
            >
              <p className="text-xs text-[#94A3B8]">{s.label}</p>
              <p className="text-2xl font-bold text-[#F8FAFC] mt-1">
                {loading ? <span className="inline-block h-7 w-8 rounded bg-slate-800 animate-pulse" /> : s.value}
              </p>
            </button>
          ))}
        </div>

        {/* ── Quick links ── */}
        <Card className="divide-y divide-white/[0.06]">
          {[
            { icon: CalendarCheck, label: "My bookings", hint: "Upcoming, active and past charging", to: "/my-bookings" },
            { icon: BookOpen, label: "Station bookings", hint: "Requests on the stations you listed", to: "/my-station-bookings" },
          ].map((l) => (
            <button
              key={l.to}
              onClick={() => navigate(l.to)}
              className="w-full flex items-center gap-4 p-4 sm:px-5 text-left hover:bg-white/[0.03] transition-colors"
            >
              <span className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.08]">
                <l.icon className="h-5 w-5" style={{ color: ACCENT }} />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-[#F8FAFC]">{l.label}</span>
                <span className="block text-xs text-[#94A3B8]">{l.hint}</span>
              </span>
              <ChevronRight className="h-5 w-5 text-slate-500" />
            </button>
          ))}
        </Card>

        {/* ── My stations ── */}
        <section id="stations" className="scroll-mt-28">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[#F8FAFC]">My stations</h2>
            <button
              onClick={() => navigate("/stations/create")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-950"
              style={{ background: ACCENT }}
            >
              <Plus className="h-4 w-4" /> Add station
            </button>
          </div>

          {loading ? (
            <div className="h-20 rounded-2xl bg-[#0E1130] border border-white/[0.06] animate-pulse" />
          ) : stations.length === 0 ? (
            <Card className="p-6 text-center">
              <Zap className="h-8 w-8 mx-auto text-slate-600 mb-2" />
              <p className="text-[#F8FAFC] font-medium">You haven't listed a charger yet</p>
              <p className="text-sm text-[#94A3B8] mt-1">Have a charger at home or your business? List it and start earning.</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {stations.map((st) => (
                <Card key={st._id} className="p-4 flex items-center gap-3">
                  <span className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center" style={{ background: `${ACCENT}1A` }}>
                    <Zap className="h-5 w-5" style={{ color: ACCENT }} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#F8FAFC] truncate">{st.name}</p>
                    <p className="flex items-center gap-1 text-xs text-[#94A3B8] truncate">
                      <MapPin className="h-3 w-3 shrink-0" /> {st.location}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: ACCENT }}>₹{st.pricePerUnit}/kWh</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => navigate(`/stations/${st._id}`)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 border border-white/[0.1] hover:bg-white/[0.06]"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/stations/edit/${st._id}`)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 border border-white/[0.1] hover:bg-white/[0.06]"
                    >
                      Edit
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* ── Danger zone ── */}
        {info.role !== "admin" && (
          <Card className="p-5 border-red-500/20">
            <h2 className="font-semibold text-red-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Delete account
            </h2>
            <p className="text-sm text-[#94A3B8] mt-1">
              This permanently deletes your account, your bookings and the stations you listed (with their bookings). This can't be undone.
            </p>
            <button
              onClick={() => {
                setConfirmText("");
                setDeleteError("");
                setShowDelete(true);
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-300 border border-red-500/30 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" /> Delete my account
            </button>
          </Card>
        )}
      </div>

      {/* Delete confirm */}
      {showDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && !deleting && setShowDelete(false)}
        >
          <div className="bg-[#0E1130] border border-white/[0.08] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-6">
            <div className="bg-red-500/10 h-12 w-12 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-[#F8FAFC]">Delete your account?</h3>
            <p className="text-sm text-[#94A3B8] mt-1">
              {stations.length > 0 && `${stations.length} station${stations.length > 1 ? "s" : ""} and `}
              all your bookings will be removed. Type <b className="text-red-300">DELETE</b> to confirm.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              aria-label="Type DELETE to confirm"
              className="mt-4 w-full px-3 py-2.5 rounded-xl bg-[#05061A]/60 border border-white/[0.1] text-[#F8FAFC] outline-none focus:border-red-400/60"
            />
            {deleteError && <p className="text-sm text-red-300 mt-2">{deleteError}</p>}
            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-5">
              <button
                onClick={() => setShowDelete(false)}
                disabled={deleting}
                className="flex-1 px-4 py-3 rounded-xl border border-white/[0.08] text-[#94A3B8] hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={confirmText !== "DELETE" || deleting}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-40 inline-flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed z-50 bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-xl ${
            toast.type === "error" ? "bg-red-600 text-white" : "text-slate-950"
          }`}
          style={toast.type === "error" ? undefined : { background: ACCENT }}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
