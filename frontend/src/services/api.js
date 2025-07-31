import axios from "axios";
import { jwtDecode } from "jwt-decode";

// Check mode (Vite supports import.meta.env.MODE)
const isDev = import.meta.env.MODE === "development";

const api = axios.create({
  baseURL: isDev
    ? "http://127.0.0.1:8000/api" // dev server
    : "https://tagayev.uz/api", // production
});

// Add Authorization header if token exists
api.interceptors.request.use(
  (config) => {
    const authTokens = localStorage.getItem("authTokens")
      ? JSON.parse(localStorage.getItem("authTokens"))
      : null;

    if (authTokens) {
      config.headers["Authorization"] = `Bearer ${authTokens.access}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
