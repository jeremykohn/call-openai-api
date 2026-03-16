export const CAPABILITY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type ModelCapabilityStatus = "supported" | "unsupported" | "unknown";

export type ModelCapabilitySource =
  | "probe"
  | "override-allow"
  | "override-disallow"
  | "cache"
  | "fallback";

export type ModelCapabilityRecord = {
  status: ModelCapabilityStatus;
  checkedAt: number;
  source: ModelCapabilitySource;
  errorCode?: string;
};

export type AllowedModelsOverrides = {
  allowed_models: string[];
  disallowed_models: string[];
};

type ResolveModelCapabilityParams = {
  modelId: string;
  overrides?: AllowedModelsOverrides;
  probeRecord?: ModelCapabilityRecord;
  now?: number;
};

const capabilityCache = new Map<string, ModelCapabilityRecord>();

const normalizeModelId = (modelId: string): string => modelId.trim();

export const isValidModelId = (modelId: string): boolean => {
  return normalizeModelId(modelId).length > 0;
};

const isRecordShape = (value: unknown): value is ModelCapabilityRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ModelCapabilityRecord>;
  const hasValidStatus =
    candidate.status === "supported" ||
    candidate.status === "unsupported" ||
    candidate.status === "unknown";
  const hasValidSource =
    candidate.source === "probe" ||
    candidate.source === "override-allow" ||
    candidate.source === "override-disallow" ||
    candidate.source === "cache" ||
    candidate.source === "fallback";

  return (
    hasValidStatus &&
    hasValidSource &&
    typeof candidate.checkedAt === "number" &&
    Number.isFinite(candidate.checkedAt)
  );
};

export const isCapabilityFresh = (
  record: ModelCapabilityRecord,
  now = Date.now(),
): boolean => {
  return now - record.checkedAt < CAPABILITY_CACHE_TTL_MS;
};

export const getCapabilityRecord = (
  modelId: string,
): ModelCapabilityRecord | null => {
  if (!isValidModelId(modelId)) {
    return null;
  }

  const cached = capabilityCache.get(normalizeModelId(modelId));
  return cached ?? null;
};

export const setCapabilityRecord = (
  modelId: string,
  record: ModelCapabilityRecord,
): void => {
  if (!isValidModelId(modelId) || !isRecordShape(record)) {
    return;
  }

  capabilityCache.set(normalizeModelId(modelId), record);
};

export const setCapabilityRecords = (
  records: Record<string, unknown>,
): void => {
  for (const [modelId, value] of Object.entries(records)) {
    if (!isValidModelId(modelId) || !isRecordShape(value)) {
      continue;
    }
    capabilityCache.set(normalizeModelId(modelId), value);
  }
};

export const getAllCapabilityRecords = (): Record<
  string,
  ModelCapabilityRecord
> => {
  return Object.fromEntries(capabilityCache.entries());
};

export const clearCapabilityCache = (): void => {
  capabilityCache.clear();
};

const getOverrideDecision = (
  modelId: string,
  overrides?: AllowedModelsOverrides,
): "allow" | "disallow" | null => {
  if (!overrides) {
    return null;
  }

  const normalizedModelId = normalizeModelId(modelId);
  if (overrides.disallowed_models.includes(normalizedModelId)) {
    return "disallow";
  }

  if (overrides.allowed_models.includes(normalizedModelId)) {
    return "allow";
  }

  return null;
};

export const resolveModelCapability = ({
  modelId,
  overrides,
  probeRecord,
  now = Date.now(),
}: ResolveModelCapabilityParams): ModelCapabilityRecord => {
  if (!isValidModelId(modelId)) {
    return {
      status: "unknown",
      checkedAt: now,
      source: "fallback",
      errorCode: "invalid_model_id",
    };
  }

  const normalizedModelId = normalizeModelId(modelId);
  const overrideDecision = getOverrideDecision(normalizedModelId, overrides);
  if (overrideDecision === "disallow") {
    return {
      status: "unsupported",
      checkedAt: now,
      source: "override-disallow",
    };
  }

  if (overrideDecision === "allow") {
    return {
      status: "supported",
      checkedAt: now,
      source: "override-allow",
    };
  }

  if (probeRecord) {
    setCapabilityRecord(normalizedModelId, probeRecord);
    return probeRecord;
  }

  const cachedRecord = getCapabilityRecord(normalizedModelId);
  if (cachedRecord && isCapabilityFresh(cachedRecord, now)) {
    return {
      ...cachedRecord,
      source: "cache",
    };
  }

  return {
    status: "unknown",
    checkedAt: now,
    source: "fallback",
  };
};
