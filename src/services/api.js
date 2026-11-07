import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3002/api"
).replace(/\/+$/, "");

console.log("🌐 API BASE URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Global response handling
api.interceptors.response.use(
  (response) => response,

  (error) => {
    console.error("❌ API ERROR:", error.response?.status);

    console.error(
      "❌ REQUEST:",
      `${error.config?.baseURL || ""}${error.config?.url || ""}`
    );

    const isLoginRequest =
      error.config?.url?.includes("/users/login");

    // Sirf tab login par bhejo jab user logged-in tha aur token expire/invalid ho gaya.
    // Guest user ko public pages (dashboard, station detail) par rehne do.
    const hadToken = Boolean(localStorage.getItem("token"));
    const isProfileRequest =
      error.config?.url?.includes("/users/profile");

    if (
      error.response?.status === 401 &&
      !isLoginRequest &&
      hadToken
    ) {
      localStorage.removeItem("token");
      // Startup par profile check fail hua to AuthContext khud guest bana deta hai
      if (!isProfileRequest) {
        const here = window.location.pathname + window.location.search;
        window.location.href = `/login?redirect=${encodeURIComponent(here)}`;
      }
    }

    return Promise.reject(error);
  }
);

export default api;