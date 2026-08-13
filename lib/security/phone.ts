import { DomainError } from "@/lib/errors/domain-error";

export function normalizePhilippinePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("63")
    ? `+${digits}`
    : digits.startsWith("0")
      ? `+63${digits.slice(1)}`
      : `+63${digits}`;

  if (!/^\+639\d{9}$/.test(normalized)) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Enter a valid Philippine mobile number.",
    );
  }
  return normalized;
}
