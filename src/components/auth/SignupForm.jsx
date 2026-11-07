import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import authService from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import AuthInput from "./AuthInput";
import GoogleButton from "./GoogleButton";
import { useRedirectTarget } from "../../hooks/useRedirectTarget";
import { Alert, Divider, PrimaryButton } from "./AuthShell";

/* Password kitna strong hai — 0 se 4 */
const scorePassword = (pw) => {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};
const STRENGTH = [
  { label: "Too short", color: "#EF4444" },
  { label: "Weak", color: "#F97316" },
  { label: "Okay", color: "#EAB308" },
  { label: "Good", color: "#22C55E" },
  { label: "Strong", color: "#00E5A8" },
];

const PasswordMeter = ({ password }) => {
  if (!password) return null;
  const score = password.length < 6 ? 0 : Math.max(1, scorePassword(password));
  const { label, color } = STRENGTH[score];
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{ background: i <= score ? color : "rgba(255,255,255,0.08)" }}
          />
        ))}
      </div>
      <p className="mt-1 text-xs" style={{ color }}>
        {label}
      </p>
    </div>
  );
};

const SignupForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle } = useAuth();
  const redirectTo = useRedirectTarget();

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const payload = { ...formData, name: formData.name.trim(), email: formData.email.trim() };
      const result = await authService.signup(payload);

      if (result.success) {
        // Backend batata hai ki OTP chahiye ya nahi
        if (result.data?.requiresVerification) {
          navigate("/verify-otp", { state: { email: payload.email, from: location.state?.from } });
        } else {
          onSuccess?.(payload.email);
        }
      } else {
        setError(result.message || "Signup failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential) => {
    setError("");
    setGoogleLoading(true);
    const result = await loginWithGoogle(credential);
    setGoogleLoading(false);
    if (result.success) {
      navigate(redirectTo, { replace: true });
    } else {
      setError(result.message);
    }
  };

  const busy = loading || googleLoading;

  return (
    <div>
      <GoogleButton text="signup_with" onCredential={handleGoogle} onError={setError} disabled={busy} />

      <Divider label="or sign up with email" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          id="signup-name"
          label="Full name"
          icon={User}
          required
          autoComplete="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Your name"
          disabled={busy}
        />

        <AuthInput
          id="signup-email"
          label="Email"
          icon={Mail}
          type="email"
          required
          autoComplete="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="you@example.com"
          disabled={busy}
        />

        <AuthInput
          id="signup-password"
          label="Password"
          icon={Lock}
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Min 6 characters"
          disabled={busy}
          hint={<PasswordMeter password={formData.password} />}
        />

        {error && <Alert>{error}</Alert>}

        <PrimaryButton type="submit" loading={busy}>
          {googleLoading ? "Signing in with Google..." : loading ? "Creating account..." : "Create account"}
        </PrimaryButton>

        <p className="text-xs text-center text-slate-500">
          By signing up, you agree to our Terms and Privacy Policy.
        </p>
      </form>
    </div>
  );
};

export default SignupForm;
