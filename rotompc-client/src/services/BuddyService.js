// rotompc-client/src/services/BuddyService.js

import axios from "axios";

import apiConfig from "@/config/api";

const API = axios.create({
  baseURL: `${apiConfig.HOST}/buddy`,
});

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

export const fetchBuddy = () => API.get("/");

export const setBuddyPokemon = (pokemon) =>
  API.patch("/pokemon", {
    pokemon,
  });

export const petBuddy = () => API.post("/pet");

export const playWithBuddy = () => API.post("/play");

export const feedBuddy = (berry) =>
  API.post("/feed", {
    berry,
  });
