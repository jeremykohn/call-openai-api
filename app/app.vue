<template>
  <div class="page">
    <header class="site-header">
      <a class="skip-link" href="#maincontent">Skip to main</a>
      <h1>ChatGPT prompt tester</h1>
      <p>Send a prompt and see the response.</p>
    </header>

    <main id="maincontent" class="main">
      <form class="prompt-form" novalidate @submit.prevent="handleSubmit">
        <label class="field-label" for="prompt-input">Prompt</label>
        <textarea
          id="prompt-input"
          ref="promptInput"
          v-model="prompt"
          class="prompt-input"
          name="prompt"
          rows="5"
          required
          aria-required="true"
          :aria-invalid="validationError ? 'true' : 'false'"
          :aria-describedby="validationError ? 'prompt-error' : undefined"
        ></textarea>
        <p v-if="validationError" id="prompt-error" class="field-error" role="alert">
          {{ validationError }}
        </p>

        <button class="submit-button" type="submit" :aria-busy="state.status === 'loading'">
          Send
        </button>
      </form>

      <section class="status" aria-live="polite" aria-atomic="true">
        <div v-if="state.status === 'loading'" class="status-row">
          <span class="spinner" aria-hidden="true"></span>
          <span>Waiting for response from ChatGPT...</span>
        </div>

        <div v-else-if="state.status === 'success'" class="status-row">
          <h2>Response</h2>
          <p class="response-text">{{ state.data }}</p>
        </div>

        <div v-else-if="state.status === 'error'" class="status-row error" role="alert">
          <h2>Something went wrong</h2>
          <p>{{ state.error }}</p>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <p>
        By messaging ChatGPT, an AI chatbot, you agree to its
        <a href="https://openai.com/policies/terms-of-use/">Terms</a> and have read its
        <a href="https://openai.com/policies/privacy-policy/">Privacy Policy</a>.
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
      body: { prompt: validation.prompt },
      throwOnError: true
    });

    succeed(response.response || "");
  } catch (error) {
    const apiError = error as { data?: ApiErrorResponse };
    const message = apiError.data?.message ?? "Request failed.";
    const details = apiError.data?.details;
    const combined = details ? `${message} ${details}` : message;

    fail(combined);
  }
};
</script>
