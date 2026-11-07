import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import SignupForm from "../components/auth/SignupForm";
import AuthShell, { AuthCard, ACCENT } from "../components/auth/AuthShell";

const COPY = {
  login: { title: "Welcome back", sub: "Login to book charging slots and manage your stations." },
  signup: { title: "Create your account", sub: "Join StayNearEV — find, book and host EV chargers." },
};

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "login");
  const [notice, setNotice] = useState(location.state?.notice || "");
  const [prefillEmail, setPrefillEmail] = useState(location.state?.email || "");

  // Tab badlo, par redirect wala state (from) mat khona
  const switchTo = (next) => {
    setMode(next);
    if (next === "signup") setNotice("");
    const q = new URLSearchParams(location.search);
    if (next === "signup") q.set("mode", "signup");
    else q.delete("mode");
    const search = q.toString();
    navigate({ pathname: "/login", search: search ? `?${search}` : "" }, { replace: true, state: location.state });
  };

  const handleSignupSuccess = (email) => {
    setPrefillEmail(email);
    setNotice("Account created! Please login to continue.");
    switchTo("login");
  };

  const reason = location.state?.from ? "Please login to continue." : null;

  return (
    <AuthShell>
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-[#F8FAFC]">{COPY[mode].title}</h2>
        <p className="mt-2 text-[#94A3B8]">{reason || COPY[mode].sub}</p>
      </div>

      <AuthCard>
        {/* Tabs — sliding pill */}
        <div className="relative grid grid-cols-2 p-1 mb-6 rounded-xl bg-[#020617]/70 border border-white/[0.06]" role="tablist">
          <span
            className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg transition-transform duration-300 ease-out"
            style={{
              transform: mode === "signup" ? "translateX(100%)" : "translateX(0)",
              background: `linear-gradient(135deg, ${ACCENT}, #06D6A0)`,
            }}
          />
          {["login", "signup"].map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchTo(m)}
              className={`relative z-10 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                mode === m ? "text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {m === "login" ? "Login" : "Sign up"}
            </button>
          ))}
        </div>

        <div key={mode} className="animate-[authFade_.25s_ease-out]">
          {mode === "login" ? (
            <LoginForm key={prefillEmail} defaultEmail={prefillEmail} notice={notice} />
          ) : (
            <SignupForm onSuccess={handleSignupSuccess} />
          )}
        </div>
      </AuthCard>

      <p className="mt-6 text-center text-sm text-[#94A3B8]">
        {mode === "login" ? "New to StayNearEV? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => switchTo(mode === "login" ? "signup" : "login")}
          className="font-semibold hover:underline"
          style={{ color: ACCENT }}
        >
          {mode === "login" ? "Create an account" : "Login"}
        </button>
      </p>

      <style>{`
        @keyframes authFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AuthShell>
  );
};

export default LoginPage;
