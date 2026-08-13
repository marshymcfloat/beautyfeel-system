import { describe, expect, it } from "vitest";
import { summarizeDurations } from "@/features/efficiency/metrics";

describe("workflow efficiency summaries", () => {
  it("calculates median duration and target rate", () => {
    expect(summarizeDurations([20, 40, 80, 100], 60)).toEqual({ samples: 4, medianSeconds: 60, targetRate: 50 });
  });

  it("reports an empty baseline honestly", () => {
    expect(summarizeDurations([], 60)).toEqual({ samples: 0, medianSeconds: null, targetRate: null });
  });
});
