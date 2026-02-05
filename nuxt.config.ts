/// <reference types="nuxt" />
import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: "2026-02-05",
  nitro: {
    preset: "vercel"
  },
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY ?? "",
    openaiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
  },
  css: ["~/assets/main.css"],
  typescript: {
    strict: true
  }
});
