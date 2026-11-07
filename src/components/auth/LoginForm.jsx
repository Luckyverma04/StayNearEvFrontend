import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Login ke baad wapas wahi page jahan se user aaya tha
  // (jaise station detail par "Book" dabaya tha)
  const fromState = location.state?.from;
  const fromQuery = new URLSearchParams(location.search).get("redirect");
  const rawTarget = fromState
    ? `${fromState.pathname}${fromState.search || ""}`
    : fromQuery || "/";
  // Sirf apni site ke andar ka path allow karo (open redirect se bachne ke liye)
  const redirectTo =
    rawTarget.startsWith("/") && !rawTarget.startsWith("//") && !rawTarget.startsWith("/login")
      ? rawTarget
      : "/";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      console.log("🔐 Login response:", result);

      if (result.success) {
        console.log("✅ Login successful, redirecting...");
        // ✅ Use navigate instead of reload
        navigate(redirectTo, { replace: true });
      } else {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err.response?.data?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter password"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
};

export default LoginForm;