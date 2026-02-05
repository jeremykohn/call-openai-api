import { describe, expect, it } from "vitest";
import { useRequestState } from "../../app/composables/use-request-state";

describe("useRequestState", () => {
  it("transitions from idle to loading to success", () => {
    const { state, start, succeed } = useRequestState();

    expect(state.value.status).toBe("idle");

    start();
    expect(state.value.status).toBe("loading");

    succeed("Hello");
    expect(state.value.status).toBe("success");
    expect(state.value.data).toBe("Hello");
    expect(state.value.error).toBeNull();
    expect(state.value.errorDetails).toBeNull();
  });

  it("transitions from idle to loading to error", () => {
    const { state, start, fail } = useRequestState();

    start();
    fail("Something went wrong", "Timeout");

    expect(state.value.status).toBe("error");
    expect(state.value.error).toBe("Something went wrong");
    expect(state.value.errorDetails).toBe("Timeout");
    expect(state.value.data).toBeNull();
  });

  it("resets to idle", () => {
    const { state, start, succeed, reset } = useRequestState();

    start();
    succeed("Done");

    reset();
    expect(state.value.status).toBe("idle");
    expect(state.value.data).toBeNull();
    expect(state.value.error).toBeNull();
    expect(state.value.errorDetails).toBeNull();
  });
});
