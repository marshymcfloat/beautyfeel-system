export type ErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SLOT_UNAVAILABLE"
  | "INVALID_STATE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; details?: Record<string, unknown> } };

export function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof DomainError) {
    return { ok: false, error: { code: error.code, message: error.message, details: error.details } };
  }
  console.error("Unhandled server error", {
    name: error instanceof Error ? error.name : "UnknownError",
  });
  return {
    ok: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong." },
  };
}
