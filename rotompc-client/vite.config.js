// filepath: rotompc-client/vite.config.js

import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";

import tailwindcss from "@tailwindcss/vite";

import { VitePWA } from "vite-plugin-pwa";

import { fileURLToPath, URL } from "node:url";

/* =========================================================
   CONFIG
========================================================= */

export default defineConfig({
  plugins: [
    react(),

    /*
     * Required for Tailwind CSS v4.
     */
    tailwindcss(),

    /* =====================================================
       PWA
    ===================================================== */

    VitePWA({
      registerType: "autoUpdate",

      /*
       * These are additional static assets that should be
       * available to the installed application.
       *
       * rotompc-icon.svg remains the browser favicon.
       *
       * It is intentionally NOT included in manifest.icons.
       */
      includeAssets: [
        "rotompc-icon.svg",

        "Rotompc-app-icon.png",

        "rotompc-app-icon-192.png",

        "rotompc-app-icon-512.png",

        "rotompc-app-icon-maskable-512.png",

        "rotompc-apple-touch-icon.png",

        "pwa-safe-area.css",
      ],

      manifest: {
        id: "/",

        name: "RotomPC",

        short_name: "RotomPC",

        description:
          "Your Pokémon Trainer network, Pokédex, Buddy, PokéSocial, and RotomAI.",

        start_url: "/",

        scope: "/",

        /*
         * Standalone makes the installed version behave
         * like an application instead of a normal browser
         * tab.
         */
        display: "standalone",

        orientation: "portrait-primary",

        background_color: "#f3f4f6",

        theme_color: "#cc0000",

        /*
         * IMPORTANT:
         *
         * These are all generated from:
         *
         * public/Rotompc-app-icon.png
         *
         * rotompc-icon.svg is NOT an install icon.
         */
        icons: [
          {
            src: "/rotompc-app-icon-192.png",

            sizes: "192x192",

            type: "image/png",

            purpose: "any",
          },

          {
            src: "/rotompc-app-icon-512.png",

            sizes: "512x512",

            type: "image/png",

            purpose: "any",
          },

          {
            src: "/rotompc-app-icon-maskable-512.png",

            sizes: "512x512",

            type: "image/png",

            purpose: "maskable",
          },
        ],
      },

      /* ===================================================
         SERVICE WORKER
      =================================================== */

      workbox: {
        cleanupOutdatedCaches: true,

        navigateFallback: "/index.html",

        runtimeCaching: [
          /* -------------------------------------------------
             ROTOMPC API

             Keep API requests network-only.
          ------------------------------------------------- */

          {
            urlPattern: /^https:\/\/rotompc-server\.vercel\.app\/api\//,

            handler: "NetworkOnly",
          },

          /* -------------------------------------------------
             POKEAPI
          ------------------------------------------------- */

          {
            urlPattern: /^https:\/\/pokeapi\.co\/api\/v2\//,

            handler: "NetworkFirst",

            options: {
              cacheName: "rotompc-pokeapi",

              networkTimeoutSeconds: 5,

              expiration: {
                maxEntries: 150,

                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },

          /* -------------------------------------------------
             IMAGES
          ------------------------------------------------- */

          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gif)$/i,

            handler: "CacheFirst",

            options: {
              cacheName: "rotompc-images",

              expiration: {
                maxEntries: 250,

                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],

  /* =======================================================
     BUILD
  ======================================================= */

  build: {
    cssMinify: "esbuild",
  },

  /* =======================================================
     ALIAS
  ======================================================= */

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
