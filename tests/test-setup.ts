import { vi } from "vitest";

process.env.OPENAI_API_KEY ??= "test-key";

vi.mock("../app/composables/use-app-head", () => ({ useAppHead: vi.fn() }));
