import { ref, readonly, type Ref } from "vue";
import type { ModelsResponse, OpenAIModel } from "~~/types/models";
import { normalizeUiError } from "~/utils/error-normalization";
import { logNormalizedUiError } from "~/utils/error-logging";

/**
 * State structure for models list management.
 */
type ModelsState = {
  status: "idle" | "loading" | "success" | "error";
  data: ReadonlyArray<OpenAIModel> | null;
  usedConfigFilter: boolean;
  showFallbackNote: boolean;
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
};

/**
 * Composable for managing OpenAI models list state.
 *
 * Handles fetching the list of available models from the `/api/models` endpoint
 * and manages the state transitions (idle → loading → success/error).
 *
 * Fetch is automatically triggered when the composable is initialized.
 *
 * @returns Object containing reactive state and fetchModels function
 * @example
 * ```ts
 * const { state, fetchModels } = useModelsState();
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
  let activeController: AbortController | null = null;
  const state: Ref<ModelsState> = ref<ModelsState>({
    status: isSSR ? "idle" : "loading",
    data: null,
    usedConfigFilter: false,
    showFallbackNote: false,
    error: null,
    errorDetails: null,
  });

  /**
   * Fetches the models list from the server API.
   * Updates state to "loading" immediately, then transitions to "success" or "error"
   * based on the API response.
   *
   * @throws Will not throw; errors are captured in state.error instead.
   */
  const fetchModels = async (): Promise<void> => {
    const requestId = ++latestRequestId;
    activeController?.abort();
    activeController = new AbortController();

    state.value.status = "loading";
    state.value.error = null;
    state.value.errorDetails = null;

    try {
      const response = await $fetch<ModelsResponse>("/api/models", {
        signal: activeController.signal,
      });

      if (requestId !== latestRequestId) {
        return;
      }

      state.value.status = "success";
      state.value.data = response.data;
      state.value.usedConfigFilter = Boolean(response.usedConfigFilter);
      state.value.showFallbackNote = Boolean(response.showFallbackNote);
      state.value.error = null;
      state.value.errorDetails = null;
    } catch (error) {
      if (requestId !== latestRequestId) {
        return;
      }

      if ((error as { name?: string })?.name === "AbortError") {
        return;
      }

      state.value.status = "error";
      state.value.data = null;
      state.value.usedConfigFilter = false;
      state.value.showFallbackNote = false;

      const normalizedError = normalizeUiError(error);
      logNormalizedUiError(normalizedError, { source: "models" });
      state.value.error = normalizedError.message;
      state.value.errorDetails = normalizedError.details ?? null;
    }
  };

  // Auto-fetch on composable initialization (skip during SSR)
  if (!isSSR) {
    fetchModels();
  }

  return {
    state: readonly(state),
    fetchModels,
  };
};
