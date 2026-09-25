// rotompc-client/src/services/BuddyService.js

import axios from "axios";

import apiConfig from "@/config/api";

/* =========================================================
   API
========================================================= */

const API = axios.create({
  baseURL: `${apiConfig.HOST}/buddy`,
});

/* =========================================================
   AUTHORIZATION
========================================================= */

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error),
);

/* =========================================================
   STATE
========================================================= */

export const fetchBuddy = () => API.get("/");

/* =========================================================
   BUDDY POKÉMON
========================================================= */

export const setBuddyPokemon = (pokemon) =>
  API.patch(
    "/pokemon",

    {
      pokemon,
    },
  );

/* =========================================================
   PET
========================================================= */

export const petBuddy = () => API.post("/pet");

/* =========================================================
   PLAY
========================================================= */

export const playWithBuddy = () => API.post("/play");

/* =========================================================
   FEED

   No pet or play requirement.
========================================================= */

export const feedBuddy = (berry) =>
  API.post(
    "/feed",

    {
      berry,
    },
  );

/* =========================================================
   EXPORT
========================================================= */

export default API;
