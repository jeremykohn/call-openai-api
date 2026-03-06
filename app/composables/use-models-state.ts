import { ref, readonly, computed, type Ref } from "vue";
import type { OpenAIModel, ModelsErrorResponse } from "../../types/models";

/**
 * State structure for models list management.
 */
type ModelsState = {
  status: "idle" | "loading" | "success" | "error";
  data: OpenAIModel[] | ReadonlyArray<OpenAIModel> | null;
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
  const state: Ref<ModelsState> = ref<ModelsState>({
    status: "loading", // Start as loading since fetch is triggered immediately
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
    state.value.status = "loading";
    state.value.error = null;
    state.value.errorDetails = null;

    try {
      const response = await $fetch<{ data: OpenAIModel[] }>("/api/models");

      state.value.status = "success";
      state.value.data = response.data;
      state.value.error = null;
      state.value.errorDetails = null;
    } catch (error) {
      state.value.status = "error";
      state.value.data = null;

      const apiError =
        typeof error === "object" && error !== null
          ? (error as { data?: ModelsErrorResponse; message?: string })
          : undefined;

      const messageFromApi = apiError?.data?.message ?? apiError?.message;
      const detailsFromApi = apiError?.data?.details ?? null;

      if (messageFromApi || detailsFromApi) {
        state.value.error = messageFromApi ?? "Unknown error";
        state.value.errorDetails = detailsFromApi;
      } else if (error instanceof Error) {
        state.value.error = error.message;
        state.value.errorDetails = null;
      } else {
        state.value.error = "An error occurred while fetching models";
        state.value.errorDetails = null;
      }
    }
  };

  // Auto-fetch on composable initialization
  fetchModels();

  return {
    state: readonly(state),
    fetchModels,
    isLoading: readonly(isLoading),
    hasError: readonly(hasError),
  };
};
