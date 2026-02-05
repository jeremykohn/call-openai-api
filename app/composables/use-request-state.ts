import { ref } from "vue";
import type { RequestState } from "../../types/chat";

const createInitialState = (): RequestState => ({
  status: "idle",
  data: null,
  error: null
});

export const useRequestState = () => {
  const state = ref<RequestState>(createInitialState());

  const start = () => {
    state.value = { status: "loading", data: null, error: null };
  };

  const succeed = (data: string) => {
    state.value = { status: "success", data, error: null };
  };

  const fail = (error: string) => {
    state.value = { status: "error", data: null, error };
  };

  const reset = () => {
    state.value = createInitialState();
  };

  return {
    state,
    start,
    succeed,
    fail,
    reset
  };
};
