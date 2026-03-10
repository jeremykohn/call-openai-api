import { useHead } from '#app';

export const useAppHead = () => {
  try {
    useHead({
      title: "ChatGPT Prompt Tester - Call OpenAI API",
      htmlAttrs: { lang: "en" },
    });
  } catch (e) {
    // Ignore errors in test or non-Nuxt environments
  }
};
