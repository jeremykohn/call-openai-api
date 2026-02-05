export type PromptRequest = {
  prompt: string;
};

export type PromptValidationResult =
  | {
      ok: true;
      prompt: string;
    }
  | {
      ok: false;
      error: string;
    };

export type ApiSuccessResponse = {
  response: string;
};

export type ApiErrorResponse = {
  message: string;
  details?: string;
};

export type RequestStatus = "idle" | "loading" | "success" | "error";

export type RequestState = {
  status: RequestStatus;
  data: string | null;
  error: string | null;
};
