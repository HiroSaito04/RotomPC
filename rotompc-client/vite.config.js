// rotompc-client/vite.config.js

import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";

import tailwindcss from "@tailwindcss/vite";

import { VitePWA } from "vite-plugin-pwa";

import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react(),

    /*
     * Required for Tailwind CSS v4.
     *
     * Without this plugin, the application can render
     * without the Tailwind-generated UI styles.
     */
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: [
        "rotompc-icon.svg",
      ],

      manifest: {
        name: "RotomPC",

        short_name: "RotomPC",

        description:
          "Your Pokémon Trainer network, Pokédex, Buddy, PokéSocial, and RotomAI.",

        start_url: "/",

        scope: "/",

        display: "standalone",

        orientation: "portrait-primary",

        background_color: "#f3f4f6",

        theme_color: "#cc0000",

        icons: [
          {
            src: "/rotompc-icon.svg",

            sizes: "any",

            type: "image/svg+xml",

            purpose: "any",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,

        navigateFallback: "/index.html",

        runtimeCaching: [
          {
            urlPattern:
              /^https:\/\/rotompc-server\.vercel\.app\/api\//,

            handler: "NetworkOnly",
          },

          {
            urlPattern:
              /^https:\/\/pokeapi\.co\/api\/v2\//,

            handler: "NetworkFirst",

            options: {
              cacheName: "rotompc-pokeapi",

              networkTimeoutSeconds: 5,

              expiration: {
                maxEntries: 150,

                maxAgeSeconds:
                  60 * 60 * 24,
              },
            },
          },

          {
            urlPattern:
              /\.(?:png|jpg|jpeg|svg|webp|gif)$/i,

            handler: "CacheFirst",

            options: {
              cacheName: "rotompc-images",

              expiration: {
                maxEntries: 250,

                maxAgeSeconds:
                  60 * 60 * 24 * 30,
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

  build: {
    cssMinify: "esbuild",
  },

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
