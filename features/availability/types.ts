export type TimeInterval = { start: Date; end: Date };

export type AllocatableService = {
  id: string;
  durationMinutes: number;
  bufferMinutes: number;
  qualifiedResourceIds: readonly string[];
};

export type ResourceKind = "NAMED_STAFF" | "FLEX_CAPACITY";

export type AvailableResource = {
  id: string;
  kind: ResourceKind;
  staffId: string | null;
  flexUnitId: string | null;
  working: readonly TimeInterval[];
  busy: readonly TimeInterval[];
  workloadMinutes: number;
};

export type AllocationSegment = {
  serviceId: string;
  resourceId: string;
  resourceKind: ResourceKind;
  staffId: string | null;
  flexUnitId: string | null;
  startsAt: Date;
  endsAt: Date;
  blockedUntil: Date;
  executionOrder: number;
};

export type AllocationPlan = {
  startsAt: Date;
  endsAt: Date;
  segments: AllocationSegment[];
  handoffs: number;
  workloadScore: number;
  flexSegments: number;
  staffingMode: ResourceKind;
};
