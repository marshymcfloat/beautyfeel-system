import type { BookingStatus } from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors/domain-error";

const transitions: Record<BookingStatus, readonly BookingStatus[]> = {
  AWAITING_PAYMENT: ["PENDING_VERIFICATION", "EXPIRED", "CANCELLED"],
  PENDING_VERIFICATION: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "NO_SHOW", "CANCELLED"],
  COMPLETED: [],
  NO_SHOW: [],
  EXPIRED: [],
  REJECTED: [],
  CANCELLED: [],
};

export function assertTransition(from: BookingStatus, to: BookingStatus) {
  if (!transitions[from].includes(to)) {
    throw new DomainError("INVALID_STATE", `Cannot change ${from} to ${to}.`);
  }
}
