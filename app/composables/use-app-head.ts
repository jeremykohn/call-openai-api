import { useHead } from "#app";

export const useAppHead = () => {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  useHead({
    title: "ChatGPT Prompt Tester - Call OpenAI API",
    htmlAttrs: { lang: "en" },
  });
};
