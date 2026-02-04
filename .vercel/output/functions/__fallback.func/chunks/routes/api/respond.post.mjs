import { d as defineEventHandler, r as readBody, s as setResponseStatus, u as useRuntimeConfig } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';

const EMPTY_PROMPT_MESSAGE = "Please enter a prompt.";
const validatePrompt = (input) => {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: EMPTY_PROMPT_MESSAGE };
  }
  return { ok: true, prompt: trimmed };
};

const OPENAI_PATH = "/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";
const extractOutputText = (response) => {
  var _a, _b, _c, _d;
  if (response.output_text) {
    return response.output_text;
  }
  const first = (_d = (_c = (_b = (_a = response.output) == null ? void 0 : _a[0]) == null ? void 0 : _b.content) == null ? void 0 : _c[0]) == null ? void 0 : _d.text;
  return first != null ? first : "";
};
const respond_post = defineEventHandler(async (event) => {
  var _a, _b;
  const body = await readBody(event);
  const validation = validatePrompt((_a = body == null ? void 0 : body.prompt) != null ? _a : "");
  if (!validation.ok) {
    setResponseStatus(event, 400);
    return { message: validation.error };
  }
  const config = useRuntimeConfig();
  const apiKey = config.openaiApiKey;
  const baseUrl = config.openaiBaseUrl;
  if (!apiKey) {
    setResponseStatus(event, 500);
    return { message: "OpenAI API key is not configured." };
  }
  try {
    const response = await fetch(new URL(OPENAI_PATH, baseUrl).toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        input: validation.prompt
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setResponseStatus(event, response.status || 500);
      return {
        message: "Request to OpenAI failed.",
        details: (_b = payload.error) == null ? void 0 : _b.message
      };
    }
    const text = extractOutputText(payload);
    const result = {
      response: text
    };
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : void 0;
    setResponseStatus(event, 500);
    return {
      message: "Request to OpenAI failed.",
      details: message
    };
  }
});

export { respond_post as default };
//# sourceMappingURL=respond.post.mjs.map
