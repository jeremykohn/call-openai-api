import { describe, it, expect, beforeEach, vi } from "vitest";
import { useModelsState } from "~/composables/use-models-state";
import type { OpenAIModel } from "~~/types/models";

// Mock the fetch function
vi.stubGlobal("$fetch", vi.fn());

describe("useModelsState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("auto-fetches models on initialization and transitions to loading state", async () => {
    const mockData: OpenAIModel[] = [
      { id: "gpt-4", object: "model", created: 1686935002, owned_by: "openai" },
    ];
    const mockFetch = vi.fn().mockResolvedValue({
      data: mockData,
    });
    vi.stubGlobal("$fetch", mockFetch);

    const { state } = useModelsState();

    // Initial status should be "loading" because fetch is triggered immediately
    expect(state.value.status).toBe("loading");

    // Wait for the async fetch to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(state.value.status).toBe("success");
    expect(state.value.data).toHaveLength(1);
  });

  it("status transitions to loading when fetch is called", async () => {
    const mockData: OpenAIModel[] = [
      { id: "gpt-4", object: "model", created: 1686935002, owned_by: "openai" },
    ];
    const mockFetch = vi.fn().mockResolvedValue({
      data: mockData,
    });
    vi.stubGlobal("$fetch", mockFetch);

    const { state, fetchModels } = useModelsState();

    const promise = fetchModels();
    expect(state.value.status).toBe("loading");

    await promise;
  });

  it("status transitions to success with data when API succeeds", async () => {
    const mockData: OpenAIModel[] = [
      { id: "gpt-4", object: "model", created: 1686935002, owned_by: "openai" },
    ];
    const mockFetch = vi.fn().mockResolvedValue({ data: mockData });
    vi.stubGlobal("$fetch", mockFetch);

    const { state, fetchModels } = useModelsState();

    await fetchModels();

    expect(state.value.status).toBe("success");
    expect(state.value.data).toEqual(mockData);
    expect(state.value.error).toBeNull();
  });

  it("status transitions to error with message when API fails", async () => {
    const errorMessage = "Failed to fetch models";
    const mockFetch = vi.fn().mockRejectedValue(new Error(errorMessage));
    vi.stubGlobal("$fetch", mockFetch);

    const { state, fetchModels } = useModelsState();

    await fetchModels();

    expect(state.value.status).toBe("error");
    expect(state.value.error).toContain(errorMessage);
    expect(state.value.data).toBeNull();
  });

  it("error state includes both message and details", async () => {
    const mockFetch = vi.fn().mockRejectedValue({
      statusCode: 401,
      data: { message: "Unauthorized", details: "Invalid API key" },
    });
    vi.stubGlobal("$fetch", mockFetch);

    const { state, fetchModels } = useModelsState();

    await fetchModels();

    expect(state.value.status).toBe("error");
    expect(state.value.error).toBeTruthy();
    expect(state.value.errorDetails).toBeTruthy();
  });

  it("multiple fetch calls update state correctly", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("$fetch", mockFetch);

    const { state, fetchModels } = useModelsState();

    // First fetch - success
    mockFetch.mockResolvedValueOnce({
      data: [
        { id: "gpt-4", created: 1686935002, owned_by: "openai" } as OpenAIModel,
      ],
    });
    await fetchModels();
    expect(state.value.status).toBe("success");
    expect(state.value.data).toHaveLength(1);

    // Second fetch - error
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    await fetchModels();
    expect(state.value.status).toBe("error");
    expect(state.value.data).toBeNull();

    // Third fetch - success again
    mockFetch.mockResolvedValueOnce({
      data: [
        {
          id: "gpt-3.5",
          created: 1686935003,
          owned_by: "openai",
        } as OpenAIModel,
      ],
    });
    await fetchModels();
    expect(state.value.status).toBe("success");
    expect(state.value.data).toHaveLength(1);
    expect(state.value.data?.[0]?.id).toBe("gpt-3.5");
  });
});
