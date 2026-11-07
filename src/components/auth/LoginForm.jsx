import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AuthInput from "./AuthInput";
import GoogleButton from "./GoogleButton";
import { Alert, Divider, PrimaryButton } from "./AuthShell";
import { useRedirectTarget } from "../../hooks/useRedirectTarget";

const LoginForm = ({ defaultEmail = "", notice = "" }) => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = useRedirectTarget();

  const [formData, setFormData] = useState({ email: defaultEmail, password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(formData.email.trim(), formData.password);

      if (result.success) {
        navigate(redirectTo, { replace: true });
      } else if (result.requiresVerification) {
        // Email verify nahi hua — seedha OTP page par bhejo
        navigate("/verify-otp", { state: { email: result.email || formData.email, from: location.state?.from } });
      } else {
        setError(result.message || "Login failed");
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
      <GoogleButton onCredential={handleGoogle} onError={setError} disabled={busy} />

      <Divider label="or login with email" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {notice && <Alert type="success">{notice}</Alert>}

        <AuthInput
          id="login-email"
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
          id="login-password"
          label="Password"
          icon={Lock}
          type="password"
          required
          autoComplete="current-password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Enter your password"
          disabled={busy}
        />

        {error && <Alert>{error}</Alert>}

        <PrimaryButton type="submit" loading={busy}>
          {googleLoading ? "Signing in with Google..." : loading ? "Logging in..." : "Login"}
        </PrimaryButton>
      </form>
    </div>
  );
};

export default LoginForm;
