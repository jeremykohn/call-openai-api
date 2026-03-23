import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROMPT = "Write a haiku about AI.";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const ENV_FILE_PATH = path.resolve(REPO_ROOT, ".env");
const OUTPUT_FILE_PATH = path.resolve(
  REPO_ROOT,
  ".github/openai-model-output-2026-01-13.md",
);
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const REQUEST_TIMEOUT_MS = Number(process.env.MODEL_RESPONSE_TIMEOUT_MS || 15_000);
const MAX_MODELS = Number(process.env.MAX_MODELS || 0);

const parseDotEnv = (content) => {
  const entries = {};

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex <= 0) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
};

const loadEnvFromFile = async (filePath) => {
  try {
    await access(filePath);
  } catch {
    throw new Error(`Missing required environment file: ${filePath}`);
  }

  const content = await readFile(filePath, "utf8");
  const parsed = parseDotEnv(content);

  for (const [key, value] of Object.entries(parsed)) {
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
};

const buildUrl = (baseUrl, endpoint) => {
  const url = new URL(baseUrl);
  const basePath = url.pathname.replace(/\/$/u, "");
  url.pathname = `${basePath}/${endpoint}`;
  return url.toString();
};

const parseJsonSafely = (rawText) => {
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
};

const fetchWithTimeout = async (url, options, timeoutMs) => {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutHandle);
  }
};

const extractOutputText = (payload) => {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (!Array.isArray(payload.output)) {
    return "";
  }

  const textParts = [];
  for (const item of payload.output) {
    if (!item || typeof item !== "object" || !Array.isArray(item.content)) {
      continue;
    }

    for (const contentItem of item.content) {
      if (!contentItem || typeof contentItem !== "object") {
        continue;
      }

      if (typeof contentItem.text === "string" && contentItem.text.trim()) {
        textParts.push(contentItem.text.trim());
      }
    }
  }

  return textParts.join("\n\n").trim();
};

const formatApiError = (payload, status, statusText, requestId) => {
  const errorObject =
    payload && typeof payload === "object" && payload.error && typeof payload.error === "object"
      ? payload.error
      : null;

  const message =
    errorObject && typeof errorObject.message === "string"
      ? errorObject.message
      : "Request to OpenAI failed.";

  const details = [
    `Message: ${message}`,
    `Status: ${status}`,
    `Status Text: ${statusText || "Unknown"}`,
  ];

  if (errorObject?.type) {
    details.push(`Type: ${String(errorObject.type)}`);
  }

  if (errorObject?.code) {
    details.push(`Code: ${String(errorObject.code)}`);
  }

  if (errorObject?.param) {
    details.push(`Param: ${String(errorObject.param)}`);
  }

  if (requestId) {
    details.push(`Request ID: ${requestId}`);
  }

  return details.join("\n");
};

const getModelIds = async (apiKey) => {
  const response = await fetchWithTimeout(
    buildUrl(OPENAI_BASE_URL, "models"),
    {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    },
    REQUEST_TIMEOUT_MS,
  );

  const raw = await response.text();
  const payload = parseJsonSafely(raw);

  if (!response.ok) {
    const requestId =
      response.headers.get("x-request-id") ||
      response.headers.get("x-openai-request-id") ||
      "";

    const details = formatApiError(payload, response.status, response.statusText, requestId);
    throw new Error(`Failed to list models.\n${details}`);
  }

  const ids = Array.isArray(payload?.data)
    ? payload.data
        .map((model) => (model && typeof model.id === "string" ? model.id.trim() : ""))
        .filter((id) => id.length > 0)
    : [];

  return Array.from(new Set(ids)).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
};

const queryModel = async (apiKey, modelId) => {
  try {
    const response = await fetchWithTimeout(
      buildUrl(OPENAI_BASE_URL, "responses"),
      {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        input: PROMPT,
      }),
    },
      REQUEST_TIMEOUT_MS,
    );

    const raw = await response.text();
    const payload = parseJsonSafely(raw);

    if (!response.ok) {
      const requestId =
        response.headers.get("x-request-id") ||
        response.headers.get("x-openai-request-id") ||
        "";

      return formatApiError(payload, response.status, response.statusText, requestId);
    }

    const outputText = extractOutputText(payload);
    if (outputText) {
      return outputText;
    }

    if (payload) {
      return JSON.stringify(payload, null, 2);
    }

    return "No response";
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return "No response";
    }
    return "No response";
  }
};

const writeFailureFile = async (message) => {
  const lines = [
    "# OpenAI Model Output (2026-01-13)",
    "",
    "## Script Error",
    message,
    "",
  ];

  await mkdir(path.dirname(OUTPUT_FILE_PATH), { recursive: true });
  await writeFile(OUTPUT_FILE_PATH, `${lines.join("\n")}`, "utf8");
};

const main = async () => {
  try {
    await loadEnvFromFile(ENV_FILE_PATH);

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is missing or empty in local .env file.");
    }

    const modelIds = await getModelIds(apiKey);
    const selectedModelIds =
      MAX_MODELS > 0 ? modelIds.slice(0, MAX_MODELS) : modelIds;

    console.log(
      `Loaded ${modelIds.length} model IDs${MAX_MODELS > 0 ? `, processing first ${selectedModelIds.length}` : ""}.`,
    );

    const lines = [
      "# OpenAI Model Output (2026-01-13)",
      "",
      `Prompt: ${PROMPT}`,
      "",
    ];

    for (const [index, modelId] of selectedModelIds.entries()) {
      console.log(`Processing ${index + 1}/${selectedModelIds.length}: ${modelId}`);
      const content = await queryModel(apiKey, modelId);
      lines.push(`## ${modelId}`);
      lines.push(content || "No response");
      lines.push("");
    }

    await mkdir(path.dirname(OUTPUT_FILE_PATH), { recursive: true });
    await writeFile(OUTPUT_FILE_PATH, `${lines.join("\n")}`, "utf8");

    console.log(
      `Wrote output for ${selectedModelIds.length} models to ${OUTPUT_FILE_PATH}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await writeFailureFile(message);
    console.error(message);
    process.exitCode = 1;
  }
};

await main();
