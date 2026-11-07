import React from "react";
import { Link } from "react-router-dom";
import { Zap, MapPin, CalendarCheck, ShieldCheck, ArrowLeft } from "lucide-react";

/* Login / Signup / OTP — sabka common dark layout.
   Same design tokens jo HomePage me hain:
   bg #020617 · card #0F172A · accent #00E5A8 */
export const ACCENT = "#00E5A8";

const gridStyle = {
  backgroundImage:
    "linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
};

const FEATURES = [
  { icon: MapPin, title: "Find chargers nearby", text: "Live list of EV stations around you." },
  { icon: CalendarCheck, title: "Book a slot in seconds", text: "No queue. Show up and plug in." },
  { icon: ShieldCheck, title: "List your own charger", text: "Earn from your home or business charger." },
];

export const Logo = ({ size = "md" }) => {
  const box = size === "lg" ? "w-12 h-12" : "w-10 h-10";
  const icon = size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group">
      <span
        className={`${box} rounded-xl flex items-center justify-center text-slate-950 shadow-lg transition-transform group-hover:scale-105`}
        style={{ background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`, boxShadow: `0 8px 28px -8px ${ACCENT}90` }}
      >
        <Zap className={icon} strokeWidth={2.5} fill="currentColor" />
      </span>
      <span className="text-xl font-bold tracking-tight text-[#F8FAFC]">
        StayNear<span style={{ color: ACCENT }}>EV</span>
      </span>
    </Link>
  );
};

const AuthShell = ({ children, showBack = true }) => (
  <div className="min-h-screen bg-[#020617] text-[#F8FAFC] relative overflow-hidden">
    {/* Background: grid + glow */}
    <div className="absolute inset-0 pointer-events-none" style={gridStyle} />
    <div
      className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-20 pointer-events-none"
      style={{ background: ACCENT }}
    />
    <div className="absolute -bottom-48 -right-40 w-[480px] h-[480px] rounded-full blur-3xl opacity-10 pointer-events-none bg-sky-500" />

    <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
      {/* Left: brand panel (desktop only) */}
      <aside className="hidden lg:flex flex-col justify-between p-12 xl:p-16 border-r border-white/[0.06]">
        <Logo size="lg" />

        <div className="max-w-md">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border mb-6"
            style={{ color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}12` }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            Live charging network
          </span>
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            Charge closer,
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(135deg, ${ACCENT}, #38BDF8)` }}
            >
              drive farther.
            </span>
          </h1>
          <p className="mt-4 text-[#94A3B8] text-lg">
            Find, book and host EV charging stations — all in one place.
          </p>

          <ul className="mt-10 space-y-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border border-white/[0.08] bg-white/[0.04]">
                  <f.icon className="h-5 w-5" style={{ color: ACCENT }} />
                </span>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-[#94A3B8]">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-500">© {new Date().getFullYear()} StayNearEV</p>
      </aside>

      {/* Right: form */}
      <main className="flex flex-col px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between lg:justify-end">
          <span className="lg:hidden">
            <Logo />
          </span>
          {showBack && (
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to stations</span>
              <span className="sm:hidden">Back</span>
            </Link>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  </div>
);

/* Card jisme form aata hai */
export const AuthCard = ({ children }) => (
  <div className="rounded-3xl border border-white/[0.08] bg-[#0F172A]/80 backdrop-blur-xl shadow-2xl shadow-black/40 p-6 sm:p-8">
    {children}
  </div>
);

export const Alert = ({ type = "error", children }) => {
  const styles =
    type === "error"
      ? "bg-red-500/10 border-red-500/30 text-red-300"
      : type === "success"
      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
      : "bg-sky-500/10 border-sky-500/30 text-sky-300";
  return (
    <div role="alert" className={`p-3 rounded-xl border text-sm ${styles}`}>
      {children}
    </div>
  );
};

export const PrimaryButton = ({ children, loading, ...props }) => (
  <button
    {...props}
    disabled={loading || props.disabled}
    className="w-full py-3 px-4 rounded-xl font-semibold text-slate-950 transition-all duration-200 hover:brightness-110 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 flex items-center justify-center gap-2"
    style={{ background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`, boxShadow: `0 10px 30px -12px ${ACCENT}90` }}
  >
    {loading && (
      <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
    )}
    {children}
  </button>
);

export const Divider = ({ label = "or" }) => (
  <div className="flex items-center gap-3 my-5">
    <div className="flex-1 h-px bg-white/[0.08]" />
    <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">{label}</span>
    <div className="flex-1 h-px bg-white/[0.08]" />
  </div>
);

export default AuthShell;
