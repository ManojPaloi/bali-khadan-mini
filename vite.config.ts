import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  base: "./", // ✅ ensures assets load correctly in production
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0", // ✅ required for Render
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    allowedHosts: [
      "bali-khadan-mini.onrender.com", // ✅ allow Render domain
    ],
  },
  
}));