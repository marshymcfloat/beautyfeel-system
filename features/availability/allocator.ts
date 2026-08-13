import type {
  AllocatableService,
  AllocationPlan,
  AllocationSegment,
  AvailableResource,
  TimeInterval,
} from "./types";

const minute = 60_000;

function overlaps(a: TimeInterval, b: TimeInterval): boolean {
  return a.start < b.end && b.start < a.end;
}

function contains(container: TimeInterval, value: TimeInterval): boolean {
  return container.start <= value.start && container.end >= value.end;
}

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [Array.from(items)];
  return items.flatMap((item, index) =>
    permutations([...items.slice(0, index), ...items.slice(index + 1)]).map(
      (rest) => [item, ...rest],
    ),
  );
}

function comparePlans(left: AllocationPlan, right: AllocationPlan): number {
  if (left.flexSegments !== right.flexSegments) return left.flexSegments - right.flexSegments;
  if (left.handoffs !== right.handoffs) return left.handoffs - right.handoffs;
  if (left.workloadScore !== right.workloadScore) {
    return left.workloadScore - right.workloadScore;
  }
  const leftStaff = left.segments.map((segment) => segment.resourceId).join(":");
  const rightStaff = right.segments.map((segment) => segment.resourceId).join(":");
  return leftStaff.localeCompare(rightStaff);
}

function allocateOrder(
  startsAt: Date,
  orderedServices: readonly AllocatableService[],
  resources: readonly AvailableResource[],
  allowFlex: boolean,
): AllocationPlan | null {
  let best: AllocationPlan | null = null;
  const resourcesById = new Map(resources.map((resource) => [resource.id, resource]));

  function visit(
    index: number,
    cursor: Date,
    segments: AllocationSegment[],
    addedBusy: Map<string, TimeInterval[]>,
    workloadScore: number,
  ) {
    if (index === orderedServices.length) {
      const handoffs = segments.reduce(
        (count, segment, i) =>
          i > 0 && segments[i - 1].resourceId !== segment.resourceId
            ? count + 1
            : count,
        0,
      );
      const plan: AllocationPlan = {
        startsAt,
        endsAt: cursor,
        segments,
        handoffs,
        workloadScore,
        flexSegments: segments.filter((segment) => segment.resourceKind === "FLEX_CAPACITY").length,
        staffingMode: segments.some((segment) => segment.resourceKind === "FLEX_CAPACITY") ? "FLEX_CAPACITY" : "NAMED_STAFF",
      };
      if (!best || comparePlans(plan, best) < 0) best = plan;
      return;
    }

    const service = orderedServices[index];
    const endsAt = new Date(cursor.getTime() + service.durationMinutes * minute);
    const blockedUntil = new Date(
      endsAt.getTime() + service.bufferMinutes * minute,
    );
    const proposed = { start: cursor, end: blockedUntil };
    const candidates = service.qualifiedResourceIds
      .map((id) => resourcesById.get(id))
      .filter((member): member is AvailableResource => Boolean(member))
      .filter((member) => allowFlex || member.kind === "NAMED_STAFF")
      .sort(
        (a, b) =>
          Number(a.kind === "FLEX_CAPACITY") - Number(b.kind === "FLEX_CAPACITY") ||
          a.workloadMinutes - b.workloadMinutes ||
          a.id.localeCompare(b.id),
      );

    for (const member of candidates) {
      if (!member.working.some((window) => contains(window, proposed))) continue;
      const allBusy = [...member.busy, ...(addedBusy.get(member.id) ?? [])];
      if (allBusy.some((interval) => overlaps(interval, proposed))) continue;

      const nextBusy = new Map(addedBusy);
      nextBusy.set(member.id, [
        ...(nextBusy.get(member.id) ?? []),
        proposed,
      ]);
      visit(
        index + 1,
        endsAt,
        [
          ...segments,
          {
            serviceId: service.id,
            resourceId: member.id,
            resourceKind: member.kind,
            staffId: member.staffId,
            flexUnitId: member.flexUnitId,
            startsAt: cursor,
            endsAt,
            blockedUntil,
            executionOrder: index,
          },
        ],
        nextBusy,
        workloadScore + member.workloadMinutes,
      );
    }
  }

  visit(0, startsAt, [], new Map(), 0);
  return best;
}

export function allocateServices(
  startsAt: Date,
  services: readonly AllocatableService[],
  resources: readonly AvailableResource[],
  options: { allowFlex: boolean } = { allowFlex: false },
): AllocationPlan | null {
  if (services.length === 0 || services.length > 6) return null;
  let best: AllocationPlan | null = null;
  for (const order of permutations(services)) {
    const plan = allocateOrder(startsAt, order, resources, options.allowFlex);
    if (plan && (!best || comparePlans(plan, best) < 0)) best = plan;
  }
  return best;
}

export function generateStartTimes(
  earliest: Date,
  latest: Date,
  intervalMinutes: number,
): Date[] {
  if (intervalMinutes <= 0 || earliest > latest) return [];
  const step = intervalMinutes * minute;
  const first = Math.ceil(earliest.getTime() / step) * step;
  const values: Date[] = [];
  for (let cursor = first; cursor <= latest.getTime(); cursor += step) {
    values.push(new Date(cursor));
  }
  return values;
}
