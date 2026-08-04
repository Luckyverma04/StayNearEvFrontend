import axios from "axios";

// ✅ Use .env variable or fallback to localhost
const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3002";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ✅ Attach token
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

// ✅ Handle expired token (FIXED)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API Error:", error.response?.status);
    console.error("❌ URL:", error.config?.baseURL + error.config?.url);

    // ❌ Login request fail ho to redirect mat karo
    const isLoginRequest =
      error.config?.url?.includes("/users/login");

    if (error.response?.status === 401 && !isLoginRequest) {
      console.warn("⚠️ Session expired. Redirecting to login...");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;