import { describe, expect, it } from "vitest";
import { formatBusinessHours } from "@/features/settings/public-info";

describe("public business hours", () => {
  it("groups consecutive days with identical hours", () => {
    const rules = Array.from({ length: 7 }, (_, index) => ({ weekday: index + 1, startMinute: 9 * 60, endMinute: 21 * 60 }));
    expect(formatBusinessHours(rules)).toEqual([{ days: "Mon–Sun", hours: "9 AM–9 PM" }]);
  });

  it("shows closed days without hiding them", () => {
    expect(formatBusinessHours([{ weekday: 1, startMinute: 540, endMinute: 1080 }])).toEqual([
      { days: "Mon", hours: "9 AM–6 PM" },
      { days: "Tue–Sun", hours: "Closed" },
    ]);
  });
});
