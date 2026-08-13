export const MANUAL_BOOKING_TARGET_SECONDS = 60;
export const TODAY_OVERVIEW_TARGET_SECONDS = 15;

export function summarizeDurations(values: number[], targetSeconds: number) {
  if (!values.length) return { samples: 0, medianSeconds: null, targetRate: null };
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const medianSeconds = sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  return {
    samples: sorted.length,
    medianSeconds,
    targetRate: Math.round((sorted.filter((value) => value <= targetSeconds).length / sorted.length) * 100),
  };
}
