export const ENV_KEYS = [
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENAI_ALLOWED_HOSTS",
  "OPENAI_ALLOW_INSECURE_HTTP",
] as const;
type OpenAIEnvKey = (typeof ENV_KEYS)[number];

/**
 * Captures the current values of the given OpenAI env keys so they can be
 * restored after a test suite mutates them. Returns an object with a
 * `restoreAll` method to reset all captured values at once.
 */
export function captureEnvVars(keys: OpenAIEnvKey[]): {
  restoreAll: () => void;
} {
  const originals = new Map<OpenAIEnvKey, string | undefined>();
  for (const key of keys) {
    originals.set(key, process.env[key]);
  }

  return {
    restoreAll() {
      for (const [key, original] of originals) {
        // ESLint no-dynamic-delete: each case uses a literal key.
        if (key === "OPENAI_API_KEY") {
          if (original === undefined) {
            delete process.env.OPENAI_API_KEY;
          } else {
            process.env.OPENAI_API_KEY = original;
          }
        } else if (key === "OPENAI_BASE_URL") {
          if (original === undefined) {
            delete process.env.OPENAI_BASE_URL;
          } else {
            process.env.OPENAI_BASE_URL = original;
          }
        } else if (key === "OPENAI_ALLOWED_HOSTS") {
          if (original === undefined) {
            delete process.env.OPENAI_ALLOWED_HOSTS;
          } else {
            process.env.OPENAI_ALLOWED_HOSTS = original;
          }
        } else if (key === "OPENAI_ALLOW_INSECURE_HTTP") {
          if (original === undefined) {
            delete process.env.OPENAI_ALLOW_INSECURE_HTTP;
          } else {
            process.env.OPENAI_ALLOW_INSECURE_HTTP = original;
          }
        } else {
          // Exhaustiveness guard: TypeScript's OpenAIEnvKey union makes this
          // unreachable at compile time, but protects against runtime misuse.
          throw new Error(
            `captureEnvVars: unsupported key "${String(key)}". Add it to the restoreAll list.`,
          );
        }
      }
    },
  };
}
