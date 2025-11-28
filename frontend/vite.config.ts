import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_URL_BACK || "http://localhost:5000";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
    preview: {
    // host y port los estás pasando ya por CLI con:
    // npm run preview -- --host 0.0.0.0 --port $PORT
    allowedHosts: ["aqua-production-a60e.up.railway.app"],
  },
  };
});

