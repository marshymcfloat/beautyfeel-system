const styles: Record<string, string> = {
  AWAITING_PAYMENT: "bg-warning-soft text-warning",
  PENDING_VERIFICATION: "bg-info-soft text-info",
  CONFIRMED: "bg-success-soft text-success",
  COMPLETED: "bg-success-soft text-success",
  NO_SHOW: "bg-surface-muted text-ink-muted",
  CANCELLED: "bg-danger-soft text-danger",
  EXPIRED: "bg-surface-muted text-ink-muted",
  REJECTED: "bg-danger-soft text-danger",
  FLEX_RESERVED: "bg-warning-soft text-warning",
};
const labels: Record<string, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  PENDING_VERIFICATION: "Payment sent",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  NO_SHOW: "No-show",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  REJECTED: "Rejected",
  FLEX_RESERVED: "Staffing required",
};
export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex min-h-7 items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${styles[status] ?? "bg-surface-muted text-ink-muted"}`}>{labels[status] ?? status}</span>;
}

