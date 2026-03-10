import { ref, readonly, computed, type Ref } from "vue";
import type { OpenAIModel } from "~~/types/models";
import { getErrorMessage, getErrorDetails } from "~/utils/type-guards";

/**
 * State structure for models list management.
 */
type ModelsState = {
  status: "idle" | "loading" | "success" | "error";
  data: ReadonlyArray<OpenAIModel> | null;
  error: string | null;
  errorDetails: string | null;
};

/**
 * Composable return type for models state management.
 */
type UseModelsStateReturn = {
  /** Readonly reactive reference to the models state */
  state: Readonly<Ref<ModelsState>>;
  /** Function to manually trigger models fetch */
  fetchModels: () => Promise<void>;
  /** Computed property indicating if data is loading */
  isLoading: Readonly<Ref<boolean>>;
  /** Computed property indicating if an error occurred */
  hasError: Readonly<Ref<boolean>>;
};

/**
 * Composable for managing OpenAI models list state.
 *
 * Handles fetching the list of available models from the `/api/models` endpoint
 * and manages the state transitions (idle → loading → success/error).
 *
 * Fetch is automatically triggered when the composable is initialized.
 *
 * @returns Object containing reactive state, fetchModels function, and computed flags
 * @example
 * ```ts
 * const { state, fetchModels, isLoading, hasError } = useModelsState();
 *
 * if (state.value.status === 'success') {
 *   // Models are available in state.value.data
 * }
 * ```
 */
export const useModelsState = (): UseModelsStateReturn => {
  // Start as idle if during SSR, loading if client-side (will fetch immediately)
  const isSSR = typeof window === "undefined";
  let latestRequestId = 0;
  const state: Ref<ModelsState> = ref<ModelsState>({
    status: isSSR ? "idle" : "loading",
    data: null,
    error: null,
    errorDetails: null,
  });

  /**
   * Computed property: indicates if fetch is in progress.
   */
  const isLoading = computed(() => state.value.status === "loading");

  /**
   * Computed property: indicates if fetch resulted in an error.
   */
  const hasError = computed(() => state.value.status === "error");

  /**
   * Fetches the models list from the server API.
   * Updates state to "loading" immediately, then transitions to "success" or "error"
   * based on the API response.
   *
   * @throws Will not throw; errors are captured in state.error instead.
   */
  const fetchModels = async (): Promise<void> => {
    const requestId = ++latestRequestId;

    state.value.status = "loading";
    state.value.error = null;
    state.value.errorDetails = null;

    try {
      const response = await $fetch<{ data: OpenAIModel[] }>("/api/models");

      if (requestId !== latestRequestId) {
        return;
      }

      state.value.status = "success";
      state.value.data = response.data;
      state.value.error = null;
      state.value.errorDetails = null;
    } catch (error) {
      if (requestId !== latestRequestId) {
        return;
      }

      state.value.status = "error";
      state.value.data = null;

      // Extract error message and details using type guards
      state.value.error = getErrorMessage(
        error,
        "An error occurred while fetching models",
      );
      state.value.errorDetails = getErrorDetails(error) ?? null;
    }
  };

  // Auto-fetch on composable initialization (skip during SSR)
  if (!isSSR) {
    fetchModels();
  }

  return {
    state: readonly(state),
    fetchModels,
    isLoading: readonly(isLoading),
    hasError: readonly(hasError),
  };
};
