import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";

import { VitePWA } from "vite-plugin-pwa";

import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: ["rotompc-icon.svg"],

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

          {
            src: "/rotompc-icon-192.png",

            sizes: "192x192",

            type: "image/png",
          },

          {
            src: "/rotompc-icon-512.png",

            sizes: "512x512",

            type: "image/png",
          },

          {
            src: "/rotompc-icon-maskable-512.png",

            sizes: "512x512",

            type: "image/png",

            purpose: "maskable",
          },
        ],
      },

      workbox: {
        navigateFallback: "/index.html",

        runtimeCaching: [
          /*
           * Do NOT cache authenticated
           * RotomPC backend requests.
           */
          {
            urlPattern: /^https:\/\/rotompc-server\.vercel\.app\/api\//,

            handler: "NetworkOnly",
          },

          /*
           * PokeAPI can use network-first
           * with a short cache.
           */
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

          /*
           * Images and static assets.
           */
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

  build: {
    cssMinify: "esbuild",
  },

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
