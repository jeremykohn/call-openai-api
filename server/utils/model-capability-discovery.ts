import type { OpenAIModelsPayload } from "../types/openai";
import { buildOpenAIUrl } from "./openai-security";
import type {
  ModelCapabilityRecord,
  ModelCapabilityStatus,
} from "./model-capability";

const OPENAI_RESPONSES_PATH = "responses";
const PROBE_INPUT = "a";
export const PROBE_MAX_OUTPUT_TOKENS = 16;
export const PROBE_TIMEOUT_MS = 2_000;

type ProbeClassification = {
  status: ModelCapabilityStatus;
  errorCode?: string;
};

type ProbeOptions = {
  modelId: string;
  apiKey: string;
  baseUrl: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  now?: number;
};

type ProbeManyOptions = {
  modelIds: readonly string[];
  apiKey: string;
  baseUrl: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  now?: number;
};

const parseProbeErrorPayload = (
  payload: unknown,
): {
  type?: string;
  code?: string;
  param?: string;
} => {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const root = payload as {
    error?: {
      type?: string;
      code?: string;
      param?: string;
    };
  };

  return {
    type: root.error?.type,
    code: root.error?.code,
    param: root.error?.param,
  };
};

export const discoverModelCandidates = (
  payload: OpenAIModelsPayload,
): string[] => {
  const ids = (payload.data ?? [])
    .map((model) => model?.id)
    .filter((id): id is string => typeof id === "string")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  return Array.from(new Set(ids));
};

export const classifyProbeResult = (
  statusCode: number,
  payload: unknown,
  isTimeout = false,
): ProbeClassification => {
  if (isTimeout) {
    return { status: "unknown", errorCode: "probe_timeout" };
  }

  if (statusCode >= 200 && statusCode < 300) {
    return { status: "supported" };
  }

  const parsedError = parseProbeErrorPayload(payload);
  const incompatibleModelErrorCodes = new Set([
    "model_not_found",
    "unsupported_model",
    "model_not_supported",
  ]);
  const isKnownIncompatibility =
    statusCode === 400 &&
    typeof parsedError.code === "string" &&
    incompatibleModelErrorCodes.has(parsedError.code);

  if (isKnownIncompatibility) {
    return {
      status: "unsupported",
      errorCode:
        parsedError.code ?? parsedError.type ?? "invalid_request_error",
    };
  }

  return {
    status: "unknown",
    errorCode: parsedError.code ?? `http_${statusCode}`,
  };
};

const withTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs: number,
): Promise<{ timedOut: false; value: T } | { timedOut: true }> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    const timeoutPromise = new Promise<{ timedOut: true }>((resolve) => {
      timeoutHandle = setTimeout(() => resolve({ timedOut: true }), timeoutMs);
    });

    const result = await Promise.race([
      operation.then((value) => ({ timedOut: false as const, value })),
      timeoutPromise,
    ]);

    return result;
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

export const probeModelCapability = async ({
  modelId,
  apiKey,
  baseUrl,
  timeoutMs = PROBE_TIMEOUT_MS,
  fetchImpl = fetch,
  now = Date.now(),
}: ProbeOptions): Promise<ModelCapabilityRecord> => {
  const requestUrl = buildOpenAIUrl(baseUrl, OPENAI_RESPONSES_PATH);
  const operation = fetchImpl(requestUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      input: PROBE_INPUT,
      max_output_tokens: PROBE_MAX_OUTPUT_TOKENS,
    }),
  });

  let result:
    | {
        timedOut: false;
        value: Response;
      }
    | {
        timedOut: true;
      };

  try {
    result = await withTimeout(operation, timeoutMs);
  } catch {
    return {
      status: "unknown",
      source: "probe",
      checkedAt: now,
      errorCode: "probe_failed",
    };
  }
  if (result.timedOut) {
    return {
      status: "unknown",
      source: "probe",
      checkedAt: now,
      errorCode: "probe_timeout",
    };
  }

  let payload: unknown = null;
  try {
    payload = await result.value.json();
  } catch {
    payload = null;
  }

  const classification = classifyProbeResult(result.value.status, payload);
  return {
    status: classification.status,
    checkedAt: now,
    source: "probe",
    errorCode: classification.errorCode,
  };
};

export const probeModelCapabilities = async ({
  modelIds,
  apiKey,
  baseUrl,
  timeoutMs = PROBE_TIMEOUT_MS,
  fetchImpl = fetch,
  now = Date.now(),
}: ProbeManyOptions): Promise<Record<string, ModelCapabilityRecord>> => {
  const uniqueModelIds = Array.from(
    new Set(modelIds.map((id) => id.trim())),
  ).filter((id) => id.length > 0);

  const records = await Promise.all(
    uniqueModelIds.map(async (modelId) => {
      const record = await probeModelCapability({
        modelId,
        apiKey,
        baseUrl,
        timeoutMs,
        fetchImpl,
        now,
      });

      return [modelId, record] as const;
    }),
  );

  return Object.fromEntries(records);
};
