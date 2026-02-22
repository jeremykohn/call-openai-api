# Application Specification: Query OpenAI Models on App Load

## Overview
This specification describes the feature to query the OpenAI Models API when the app opens, display the list of available models in the UI if the query succeeds, or show an error message if the query fails.

## Feature Summary
- When the Nuxt app mounts, an API call is made to OpenAI to fetch the list of available models.
- The models are displayed in a dedicated UI section below the chat prompt form.
- If the query fails, a user-friendly error message is displayed instead.

---

## API Integration

### Endpoint
**GET** `https://api.openai.com/v1/models`

### Authentication
- Requires OpenAI API key in the `Authorization` header: `Bearer $OPENAI_API_KEY`
- API key is read from `runtimeConfig.openaiApiKey` (sourced from the `.env` file)

### Response Format (Success)
```json
{
  "object": "list",
  "data": [
    {
      "id": "model-id-0",
      "object": "model",
      "created": 1686935002,
      "owned_by": "organization-owner"
    },
    {
      "id": "model-id-1",
      "object": "model",
      "created": 1686935002,
      "owned_by": "openai"
    }
  ]
}
```

### Response Properties
- `object`: Always `"list"` for this endpoint
- `data`: Array of model objects, each containing:
  - `id`: Unique model identifier (string)
  - `object`: Always `"model"` (string)
  - `created`: Unix timestamp of model creation (number)
  - `owned_by`: Organization or entity that owns the model (string)

### Error Handling
- If the API call fails (network error, invalid key, server error, etc.), the UI displays: **"Error: Failed API call, could not get list of OpenAI models"** followed by the details of the failed API call.

---

## Architecture

### Backend (Server Route)
- **File**: `server/api/models.get.ts` (new)
- **Purpose**: Proxy the OpenAI Models API to protect the API key and handle errors
- **Responsibilities**:
  - Fetch the list of models from OpenAI
  - Return the models data to the client
  - Return error details if the call fails

### Frontend (Composable & State)
- **File**: `app/composables/use-models-list.ts` (new)
- **Purpose**: Manage models list state and fetch logic
- **State Properties**:
  - `status`: `"idle" | "loading" | "success" | "error"`
  - `data`: Array of models or null
  - `error`: Error message or null

### UI Component
- **File**: `app/app.vue` (updated)
- **Location**: New section below the chat prompt form and submit button
- **Display Logic**:
  - **Loading**: Spinner with "Loading available models..."
  - **Success**: Display a list of available models
  - **Error**: Display "Error: Failed API call, could not get list of OpenAI models" followed by the details of the failed API call
  - **Idle**: Show nothing or placeholder

---

## User Interface

### Models Section Layout
The new section appears between the chat form and the status area (loading/response/error):

```
┌─────────────────────────────────────────┐
│  [Chat Prompt Form + Submit Button]     │
├─────────────────────────────────────────┤
│  [Models List Section]                  │
│  - Loading spinner (if fetching)        │
│  - List of models (if success)          │
│  - Error message (if failed)            │
├─────────────────────────────────────────┤
│  [Chat Response/Status Area]            │
└─────────────────────────────────────────┘
```

### Success State (Models Loaded)
- Display a list of models
- Each model shows:
  - Model ID (e.g., `gpt-4`, `gpt-3.5-turbo`)
  - Owner/organization (in smaller text)
  - Creation date (in smaller text)
- Styling: Use Tailwind utilities consistent with the existing UI (cards, text hierarchy)

### Error State
- Display: **"Error: Failed API call, could not get list of OpenAI models"** followed by the details of the failed API call
- Styling: Red/alert color scheme (consistent with existing error styling in the app)
- Context: Error should appear in the same section where models would normally display

### Loading State
- Display spinner animation with text "Loading available models..."
- Use existing spinner component from the chat response loading state (if shared)
- Styling: Consistent with existing loading indicators

---

## Component Implementation Details

### `server/api/models.get.ts`
```typescript
// GET /api/models
// Fetches the list of available models from OpenAI API
// Returns { data: Model[] } on success
// Returns error with message and details on failure
```

### `app/composables/use-models-list.ts`
```typescript
// Composable for managing models list state
// Exposes:
//   - state: Reactive { status, data, error }
//   - fetch(): Promise<void> - Fetches models from /api/models
```

### `app/app.vue` Updates
```vue
<!-- Add new section below form, above status area -->
<section class="models-list-section">
  <!-- Loading state -->
  <div v-if="modelsState.status === 'loading'">
    [Spinner + "Loading available models..."]
  </div>

  <!-- Success state -->
  <div v-else-if="modelsState.status === 'success'">
    [List of models]
  </div>

  <!-- Error state -->
  <div v-else-if="modelsState.status === 'error'">
    Error: Failed query to get list of OpenAI models
  </div>
</section>
```

---

## Initialization & Lifecycle

### On App Mount
1. App component (`app.vue`) mounts
2. `useModelsState()` composable is initialized
3. Composable immediately calls `fetch()` to query `/api/models`
4. API route (`server/api/models.get.ts`) fetches from OpenAI
5. Results populate the UI section or error is displayed

### Error Recovery
- No automatic retry; user can manually refresh the page
- Future enhancement: Add a "Retry" button in the error state

---

## Testing

### Unit Tests
- Test `use-models-list.ts` state transitions (idle → loading → success/error)
- Test error message handling

### Integration Tests
- Test `server/api/models.get.ts` response structure
- Mock OpenAI API responses
- Test error scenarios (network error, invalid key, etc.)

### E2E Tests
- Verify the models section appears after app load
- Verify loading spinner displays
- Verify models list or error message displays correctly
- Test with network failures or timeouts

---

## Dependencies & Requirements
- Existing OpenAI API key in `.env` (already in use for chat responses)
- Nuxt 4 + Vue 3 + Tailwind CSS (already in place)
- No new npm packages required
- Uses existing `$fetch` composable from Nuxt

---

## Notes
- The models list is queried **on app load**, not tied to the chat form submission
- The models list is displayed **separately** from the chat response area
- The feature is **non-blocking**; if the query fails, the chat form remains functional
- Future enhancement: Allow users to select a model for the chat (scope outside this spec)
