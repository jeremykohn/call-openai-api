<template>
  <div class="grid gap-2">
    <label
      class="flex items-center gap-1 text-sm font-semibold text-slate-700"
      for="models-select"
    >
      Model
      <span v-if="required" class="text-red-600" aria-hidden="true">*</span>
    </label>

    <!-- Loading Indicator -->
    <div
      v-if="status === 'loading'"
      data-testid="loading-indicator"
      role="status"
      aria-live="polite"
      class="flex items-center gap-2 text-sm text-slate-600"
    >
      <svg
        class="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      Loading models...
    </div>

    <!-- Select Element (visible in all non-loading states) -->
    <select
      v-if="status !== 'loading'"
      id="models-select"
      data-testid="models-select"
      :value="selectedModelId || ''"
      :disabled="status === 'error' || !hasModels"
      :aria-busy="false"
      :aria-invalid="status === 'error' ? 'true' : 'false'"
      :aria-required="required"
      :aria-describedby="describedBy"
      :required="required"
      @change="handleSelectChange"
      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
    >
      <option value="">
        {{ hasModels ? "Select a model" : "No models available" }}
      </option>
      <option v-for="model in models" :key="model.id" :value="model.id">
        {{ model.id }}
      </option>
    </select>

    <p
      v-if="status !== 'loading'"
      id="models-select-help"
      class="text-xs text-slate-500"
    >
      Uses <code class="font-mono">{{ DEFAULT_MODEL }}</code> by default if none is selected.
    </p>

    <!-- Error Message -->
    <div
      v-if="status === 'error' && error"
      id="models-select-error"
      role="alert"
      class="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 border border-red-200"
    >
      <p class="font-semibold">{{ error }}</p>
      <p v-if="errorDetails" class="mt-1 text-red-700">{{ errorDetails }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { OpenAIModel } from "~~/types/models";
import { DEFAULT_MODEL } from "~~/shared/constants/models";

/**
 * Props for ModelsSelector component.
 */
const props = defineProps<{
  /** List of available models to display */
  models: readonly OpenAIModel[];
  /** Currently selected model ID (v-model) */
  selectedModelId: string | null;
  /** Loading/error status */
  status: "idle" | "loading" | "success" | "error";
  /** Error message (when status is 'error') */
  error?: string | null;
  /** Error details (when status is 'error') */
  errorDetails?: string | null;
  /** Whether the selection is required */
  required?: boolean;
}>();

const hasModels = computed(() => props.models.length > 0);

const describedBy = computed(() => {
  const ids = ["models-select-help"];
  if (props.status === "error" && props.error) {
    ids.unshift("models-select-error");
  }
  return ids.join(" ");
});

/**
 * Events emitted by the component.
 */
const emit = defineEmits<{
  /** Update the v-model value with selected model ID */
  "update:selectedModelId": [modelId: string | null];
  /** Emit when a model is selected with full model object */
  "model-selected": [model: OpenAIModel];
}>();

/**
 * Retrieves full model object from models list by ID.
 */
const getModelById = (id: string): OpenAIModel | undefined => {
  return props.models.find((m: OpenAIModel) => m.id === id);
};

/**
 * Handles select element change event.
 * Emits both update:selectedModelId and model-selected events.
 */
const handleSelectChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const modelId = target.value;

  emit("update:selectedModelId", modelId || null);

  if (modelId) {
    const model = getModelById(modelId);
    if (model) {
      emit("model-selected", model);
    }
  }
};
</script>
