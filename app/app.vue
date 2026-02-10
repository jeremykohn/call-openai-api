<template>
  <div class="page min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
    <header class="px-6 pb-8 pt-12 text-center">
      <a
        class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-slate-900 focus:px-3 focus:py-2 focus:text-white"
        href="#maincontent"
      >
        Skip to main
      </a>
      <h1 class="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">ChatGPT prompt tester</h1>
      <p class="mx-auto mt-3 max-w-xl text-base text-slate-600 sm:text-lg">
        Send a prompt and see the response.
      </p>
    </header>

    <main id="maincontent" class="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 pb-14">
      <form
        class="grid gap-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <label class="text-sm font-semibold text-slate-700" for="prompt-input">Prompt</label>
        <textarea
          id="prompt-input"
          ref="promptInput"
          v-model="prompt"
          class="min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          name="prompt"
          rows="5"
          required
          aria-required="true"
          :aria-invalid="validationError ? 'true' : 'false'"
          :aria-describedby="validationError ? 'prompt-error' : undefined"
        ></textarea>
        <p v-if="validationError" id="prompt-error" class="text-sm text-red-700" role="alert">
          {{ validationError }}
        </p>

        <button
          class="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          type="submit"
          :aria-busy="state.status === 'loading'"
        >
          Send
        </button>
      </form>

      <section class="grid gap-4" aria-live="polite" aria-atomic="true">
        <div
          v-if="state.status === 'loading'"
          class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 p-6 text-slate-700 shadow-sm"
        >
          <span class="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" aria-hidden="true"></span>
          <span class="text-sm font-medium">Waiting for response from ChatGPT...</span>
        </div>

        <div
          v-else-if="state.status === 'success'"
          class="grid gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-emerald-900 shadow-sm"
        >
          <h2 class="text-lg font-semibold">Response</h2>
          <p class="whitespace-pre-wrap text-sm text-emerald-900">
            {{ state.data }}
          </p>
        </div>

        <div
          v-else-if="state.status === 'error'"
          class="grid gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-6 text-red-900 shadow-sm"
          role="alert"
        >
          <h2 class="text-lg font-semibold">Something went wrong</h2>
          <p class="text-sm text-red-800">{{ state.error }}</p>
          <p v-if="state.errorDetails" class="text-sm text-red-700">
            <span class="font-semibold">Details:</span> {{ state.errorDetails }}
          </p>
        </div>
      </section>
    </main>

    <footer class="mt-6 border-t border-slate-200 bg-white/80 px-6 py-6 text-center text-sm text-slate-600">
      <p class="mx-auto max-w-3xl">
        By messaging ChatGPT, an AI chatbot, you agree to its
        <a class="font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500" href="https://openai.com/policies/terms-of-use/">Terms</a>
        and have read its
        <a class="font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500" href="https://openai.com/policies/privacy-policy/">Privacy Policy</a>.
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRequestState } from "./composables/use-request-state";
import { validatePrompt } from "./utils/prompt-validation";
import type { ApiErrorResponse, ApiSuccessResponse } from "../types/chat";

const prompt = ref("");
const promptInput = ref<HTMLTextAreaElement | null>(null);
const validationError = ref<string | null>(null);

const { state, start, succeed, fail } = useRequestState();

const handleSubmit = async () => {
  validationError.value = null;

  const validation = validatePrompt(prompt.value);
  if (!validation.ok) {
    validationError.value = validation.error;
    promptInput.value?.focus();
    return;
  }

  start();

  try {
    const response = await $fetch<ApiSuccessResponse>("/api/respond", {
      method: "POST",
      body: { prompt: validation.prompt }
    });

    succeed(response.response || "");
  } catch (error) {
    const apiError = error as { data?: ApiErrorResponse };
    const message = apiError.data?.message ?? "Request failed.";
    const details = apiError.data?.details ?? (error instanceof Error ? error.message : undefined);

    fail(message, details);
  }
};
</script>
