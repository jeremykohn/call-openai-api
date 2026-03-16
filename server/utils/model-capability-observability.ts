import type { ModelCapabilityRecord } from "./model-capability";

type CapabilityMetricCounts = {
  supported: number;
  unsupported: number;
  unknown: number;
};

export const summarizeCapabilityStatuses = (
  records: Record<string, ModelCapabilityRecord>,
): CapabilityMetricCounts => {
  const summary: CapabilityMetricCounts = {
    supported: 0,
    unsupported: 0,
    unknown: 0,
  };

  for (const record of Object.values(records)) {
    summary[record.status] += 1;
  }

  return summary;
};

export const logCapabilityInfo = (
  event: string,
  fields: Record<string, unknown>,
): void => {
  // eslint-disable-next-line no-console
  console.info(
    JSON.stringify({
      level: "info",
      event,
      ...fields,
    }),
  );
};

export const emitCapabilityMetrics = (metrics: {
  discovered: number;
  probed: number;
  supported: number;
  unsupported: number;
  unknown: number;
  cacheHitRate: number;
}): void => {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      metric: "model_capability_summary",
      ...metrics,
    }),
  );
};
