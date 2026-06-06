import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During local dev, proxy the gateway so the app can use same-origin /ws and /api.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/ws": { target: "ws://localhost:8090", ws: true },
      "/api": { target: "http://localhost:8090" },
    },
  },
});
