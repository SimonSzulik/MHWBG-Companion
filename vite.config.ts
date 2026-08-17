import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  envPrefix: ["SUPABASE_"],
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // The app registers the worker itself (src/lib/pwa/registerUpdates.ts)
      // so it can poll for new builds; without that an installed PWA can run a
      // stale bundle indefinitely. See QA-8 in docs/qa/e2e-report.md.
      injectRegister: null,
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "MHW Board Game Companion",
        short_name: "MHW Companion",
        description:
          "Kampagnen-Tracker & Charakterbogen für Monster Hunter World: The Board Game",
        lang: "de",
        theme_color: "#c47a2c",
        background_color: "#f5f1e6",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // App shell is fully client-side + local-first, so precache the build
        // and serve index.html for any navigation (SPA fallback).
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "/index.html",
        // Supabase REST/Realtime must always hit the network when online.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.endsWith("supabase.co"),
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
