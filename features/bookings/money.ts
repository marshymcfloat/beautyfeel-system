export function calculateDepositCentavos(
  subtotalCentavos: number,
  depositPercent: number,
): number {
  return Math.ceil((subtotalCentavos * depositPercent) / 100);
}
