import { vi } from "vitest";

process.env.OPENAI_API_KEY ??= "test-key";

vi.stubGlobal("useHead", vi.fn());
