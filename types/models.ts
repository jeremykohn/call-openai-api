export type OpenAIModel = {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
};

export type ModelsResponse = {
  object: "list";
  data: OpenAIModel[] | ReadonlyArray<OpenAIModel>;
  usedConfigFilter: boolean;
  showFallbackNote: boolean;
};

export type ModelsErrorResponse = {
  message: string;
  details?: string;
};
