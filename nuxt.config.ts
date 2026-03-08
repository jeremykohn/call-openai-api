/// <reference types="nuxt" />
import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: "2026-02-05",
  modules: ["@nuxtjs/tailwindcss"],
  nitro: {
    preset: "vercel",
  },
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY ?? "",
    openaiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    openaiAllowedHosts: process.env.OPENAI_ALLOWED_HOSTS ?? "api.openai.com",
    openaiAllowInsecureHttp:
      process.env.OPENAI_ALLOW_INSECURE_HTTP ??
      (process.env.NODE_ENV === "production" ? "false" : "true"),
  },
  css: ["~/assets/main.css"],
  typescript: {
    strict: true,
  },
});
