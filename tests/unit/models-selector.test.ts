/**
 * Unit tests for ModelsSelector component - Consolidated re-export.
 *
 * This file re-exports all tests that have been organized into focused modules:
 * - rendering.test.ts - DOM structure and element rendering
 * - state-management.test.ts - Component state and disabled states
 * - error-handling.test.ts - Error message display
 * - user-interaction.test.ts - Event emissions
 * - accessibility.test.ts - WCAG 2.2 compliance (ARIA, labels, keyboard)
 * - edge-cases.test.ts - Boundary conditions and uncommon scenarios
 *
 * To run all ModelsSelector tests:
 *   npm run test:unit -- tests/unit/models-selector
 *
 * To run a specific category:
 *   npm run test:unit -- tests/unit/models-selector/rendering.test.ts
 *   npm run test:unit -- tests/unit/models-selector/state-management.test.ts
 *   npm run test:unit -- tests/unit/models-selector/error-handling.test.ts
 *   npm run test:unit -- tests/unit/models-selector/user-interaction.test.ts
 *   npm run test:unit -- tests/unit/models-selector/accessibility.test.ts
 *   npm run test:unit -- tests/unit/models-selector/edge-cases.test.ts
 */
// Re-export tests from organized test files
export {} from "./models-selector/rendering.test";
export {} from "./models-selector/state-management.test";
export {} from "./models-selector/error-handling.test";
export {} from "./models-selector/user-interaction.test";
export {} from "./models-selector/accessibility.test";
export {} from "./models-selector/edge-cases.test";
