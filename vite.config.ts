import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export default defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "react-map-gl": path.resolve(__dirname, "node_modules/react-map-gl"),
      "mapbox-gl": path.resolve(__dirname, "node_modules/mapbox-gl"),
    },
  },
  optimizeDeps: {
    include: ['react-map-gl', 'mapbox-gl'],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      }
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
