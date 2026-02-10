import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{vue,js,ts}",
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.{vue,js,ts}",
    "./pages/**/*.{vue,js,ts}",
    "./server/**/*.{ts,js}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
} satisfies Config;
