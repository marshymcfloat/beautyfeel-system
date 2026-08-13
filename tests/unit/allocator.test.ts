import { describe, expect, it } from "vitest";
import { allocateServices, generateStartTimes } from "@/features/availability/allocator";

const at = (time: string) => new Date(`2026-08-10T${time}:00.000Z`);
const staff = (id: string, workloadMinutes = 0, busy: { start: Date; end: Date }[] = []) => ({
  id: `staff:${id}`,
  kind: "NAMED_STAFF" as const,
  staffId: id,
  flexUnitId: null,
  working: [{ start: at("00:00"), end: at("08:00") }],
  busy,
  workloadMinutes,
});
const flex = (id: string) => ({
  id: `flex:${id}`,
  kind: "FLEX_CAPACITY" as const,
  staffId: null,
  flexUnitId: id,
  working: [{ start: at("00:00"), end: at("08:00") }],
  busy: [],
  workloadMinutes: 0,
});

describe("availability allocator", () => {
  it("allocates sequential services to qualified staff with buffers", () => {
    const plan = allocateServices(
      at("01:00"),
      [
        { id: "nails", durationMinutes: 60, bufferMinutes: 10, qualifiedResourceIds: ["staff:a"] },
        { id: "lashes", durationMinutes: 90, bufferMinutes: 5, qualifiedResourceIds: ["staff:b"] },
      ],
      [staff("a"), staff("b")],
    );

    expect(plan?.segments).toHaveLength(2);
    expect(plan?.segments[0].blockedUntil).toEqual(at("02:10"));
    expect(plan?.endsAt).toEqual(at("03:30"));
  });

  it("rejects a staff conflict and uses another qualified staff member", () => {
    const plan = allocateServices(
      at("01:00"),
      [{ id: "massage", durationMinutes: 60, bufferMinutes: 0, qualifiedResourceIds: ["staff:a", "staff:b"] }],
      [
        staff("a", 0, [{ start: at("00:30"), end: at("02:00") }]),
        staff("b", 60),
      ],
    );
    expect(plan?.segments[0].staffId).toBe("b");
  });

  it("prefers fewer handoffs then lower workload", () => {
    const plan = allocateServices(
      at("01:00"),
      [
        { id: "one", durationMinutes: 30, bufferMinutes: 0, qualifiedResourceIds: ["staff:a", "staff:b"] },
        { id: "two", durationMinutes: 30, bufferMinutes: 0, qualifiedResourceIds: ["staff:a", "staff:b"] },
      ],
      [staff("a", 120), staff("b", 30)],
    );
    expect(plan?.segments.map((segment) => segment.staffId)).toEqual(["b", "b"]);
  });

  it("prefers named staff and only uses flex when allowed", () => {
    const service = { id: "nails", durationMinutes: 60, bufferMinutes: 0, qualifiedResourceIds: ["staff:a", "flex:f1"] };
    const named = allocateServices(at("01:00"), [service], [staff("a"), flex("f1")], { allowFlex: true });
    expect(named?.staffingMode).toBe("NAMED_STAFF");

    const unavailableStaff = staff("a", 0, [{ start: at("00:00"), end: at("08:00") }]);
    expect(allocateServices(at("01:00"), [service], [unavailableStaff, flex("f1")], { allowFlex: false })).toBeNull();
    expect(allocateServices(at("01:00"), [service], [unavailableStaff, flex("f1")], { allowFlex: true })?.staffingMode).toBe("FLEX_CAPACITY");
  });

  it("creates five-minute start times", () => {
    expect(generateStartTimes(at("01:02"), at("01:16"), 5)).toEqual([
      at("01:05"),
      at("01:10"),
      at("01:15"),
    ]);
  });
});
