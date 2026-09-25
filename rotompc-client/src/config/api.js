// rotompc-client/src/config/api.js

const RAW_HOST = String(import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

if (!RAW_HOST) {
  console.error("[RotomPC] VITE_API_URL is missing.");
}

const HOST = RAW_HOST || "http://localhost:8000/api";

export default {
  HOST,
};
