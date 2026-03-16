import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_MODEL } from "~~/shared/constants/models";
import { clearModelsCache } from "../../server/utils/openai-model-validation";

let requestBody: { prompt: string; model?: string };
let responseStatus = 200;
let modelsFetchOk = true;
let runtimeConfig = {
  openaiApiKey: "test-key",
  openaiBaseUrl: "https://api.openai.test/v1",
  openaiAllowedHosts: "api.openai.test",
  openaiAllowInsecureHttp: "false",
};

const readBodyMock = vi.fn();
const setResponseStatusMock = vi.fn();

vi.mock("h3", () => ({
  defineEventHandler: (handler: unknown) => handler,
  readBody: (...args: unknown[]) => readBodyMock(...args),
  setResponseStatus: (...args: unknown[]) => setResponseStatusMock(...args),
}));

vi.mock("nitropack/runtime", () => ({
  useRuntimeConfig: () => runtimeConfig,
}));

vi.mock("../../app/utils/prompt-validation", () => ({
  validatePrompt: (prompt: string) => ({ ok: true, prompt }),
}));

const buildFetchResponse = (options: {
  ok: boolean;
  status: number;
  statusText?: string;
  jsonPayload?: unknown;
  textPayload?: string;
}) => ({
  ok: options.ok,
  status: options.status,
  statusText: options.statusText ?? "OK",
  headers: {
    get: () => null,
  },
  json: async () => options.jsonPayload,
  text: async () => options.textPayload ?? "",
});

const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
  if (url.endsWith("/models")) {
    if (!modelsFetchOk) {
      return buildFetchResponse({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
      });
    }

    return buildFetchResponse({
      ok: true,
      status: 200,
      jsonPayload: {
        data: [{ id: "gpt-4" }, { id: "gpt-3.5-turbo" }, { id: DEFAULT_MODEL }],
      },
    });
  }

  if (url.endsWith("/responses")) {
    return buildFetchResponse({
      ok: true,
      status: 200,
      textPayload: JSON.stringify({ output_text: "Hello from OpenAI" }),
    });
  }

  throw new Error(
    `Unexpected URL: ${url} with body ${JSON.stringify(init?.body)}`,
  );
});

vi.stubGlobal("fetch", fetchMock);

const { default: handler } = await import("../../server/api/respond.post");

describe("Server: Model Validation Logic", () => {
  beforeEach(() => {
    responseStatus = 200;
    modelsFetchOk = true;
    requestBody = { prompt: "Hello" };
    runtimeConfig = {
      openaiApiKey: "test-key",
      openaiBaseUrl: "https://api.openai.test/v1",
      openaiAllowedHosts: "api.openai.test",
      openaiAllowInsecureHttp: "false",
    };
    vi.clearAllMocks();
    clearModelsCache(); // Clear cache between tests

    readBodyMock.mockImplementation(async () => requestBody);
    setResponseStatusMock.mockImplementation((_, status: number) => {
      responseStatus = status;
    });
  });

  it("accepts valid model from request", async () => {
    requestBody = { prompt: "Hello", model: "gpt-4" };

    const result = await handler({} as never);

    expect(responseStatus).toBe(200);
    expect(result).toEqual({
      response: "Hello from OpenAI",
      model: "gpt-4",
    });

    const responsesCall = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith("/responses"),
    );
    expect(responsesCall).toBeDefined();

    const requestInit = responsesCall?.[1] as RequestInit;
    expect(JSON.parse(String(requestInit.body))).toMatchObject({
      model: "gpt-4",
      input: "Hello",
    });
  });

  it("rejects invalid model with 400 status", async () => {
    requestBody = { prompt: "Hello", model: "not-a-real-model" };

    const result = await handler({} as never);

    expect(responseStatus).toBe(400);
    expect(result).toEqual({ message: "Model is not valid" });

    const responsesCall = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith("/responses"),
    );
    expect(responsesCall).toBeUndefined();
  });

  it("uses default model when model is not provided", async () => {
    requestBody = { prompt: "Hello" };

    const result = await handler({} as never);

    expect(responseStatus).toBe(200);
    expect(result).toEqual({
      response: "Hello from OpenAI",
      model: DEFAULT_MODEL,
    });

    const responsesCall = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith("/responses"),
    );
    expect(responsesCall).toBeDefined();

    const requestInit = responsesCall?.[1] as RequestInit;
    expect(JSON.parse(String(requestInit.body))).toMatchObject({
      model: DEFAULT_MODEL,
      input: "Hello",
    });
  });

  it("reuses the cached models list across repeated validations", async () => {
    requestBody = { prompt: "Hello", model: "gpt-4" };

    const firstResult = await handler({} as never);

    requestBody = { prompt: "Hello again", model: "gpt-3.5-turbo" };

    const secondResult = await handler({} as never);

    expect(firstResult).toEqual({
      response: "Hello from OpenAI",
      model: "gpt-4",
    });
    expect(secondResult).toEqual({
      response: "Hello from OpenAI",
      model: "gpt-3.5-turbo",
    });

    const modelsCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).endsWith("/models"),
    );
    const responsesCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).endsWith("/responses"),
    );

    expect(modelsCalls).toHaveLength(1);
    expect(responsesCalls).toHaveLength(2);
  });

  it("returns 502 when model validation cannot be performed", async () => {
    modelsFetchOk = false;
    requestBody = { prompt: "Hello", model: "gpt-4" };

    const result = await handler({} as never);

    expect(responseStatus).toBe(502);
    expect(result).toEqual({
      message: "Unable to validate model right now. Please try again.",
    });

    const responsesCall = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith("/responses"),
    );
    expect(responsesCall).toBeUndefined();
  });

  it("rejects capability-unverified model with 400 status", async () => {
    requestBody = { prompt: "Hello", model: "gpt-image-1.5" };

    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/models")) {
        return buildFetchResponse({
          ok: true,
          status: 200,
          jsonPayload: {
            data: [
              {
                id: "gpt-image-1.5",
                capabilityUnverified: true,
              },
              { id: DEFAULT_MODEL },
            ],
          },
        });
      }

      if (url.endsWith("/responses")) {
        return buildFetchResponse({
          ok: true,
          status: 200,
          textPayload: JSON.stringify({ output_text: "Should not happen" }),
        });
      }

      throw new Error(
        `Unexpected URL: ${url} with body ${JSON.stringify(init?.body)}`,
      );
    });

    const result = await handler({} as never);

    expect(responseStatus).toBe(400);
    expect(result).toEqual({
      message: "Model availability is unverified. Please select a different model.",
    });

    const responsesCall = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith("/responses"),
    );
    expect(responsesCall).toBeUndefined();
  });

  it("returns 500 when allowlist contains invalid entries", async () => {
    runtimeConfig.openaiAllowedHosts =
      "api.openai.test, https://example.com/v1";

    const result = await handler({} as never);

    expect(responseStatus).toBe(500);
    expect(result).toEqual({
      message: "OPENAI_ALLOWED_HOSTS contains invalid host entries",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
