import type { NitroConfig } from "nitropack/types";

declare module "nuxt/schema" {
  interface NuxtConfig {
    nitro?: NitroConfig;
  }
}
