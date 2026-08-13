export function trustedVerificationLifetimeDays(
  configuredDays: number | null | undefined,
) {
  return configuredDays ?? 30;
}
