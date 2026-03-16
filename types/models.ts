export type OpenAIModel = {
  id: string;
  object: "model";
  created: number;
  owned_by: string;
  capabilityUnverified?: boolean;
};

export type ModelsResponse = {
  object: "list";
  data: OpenAIModel[] | ReadonlyArray<OpenAIModel>;
};

export type ModelsErrorResponse = {
  message: string;
  details?: string;
};
