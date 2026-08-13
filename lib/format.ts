import { DateTime } from "luxon";

export function formatMoney(centavos: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(centavos / 100);
}
export function formatManilaDate(value: Date | string) {
  return DateTime.fromJSDate(value instanceof Date ? value : new Date(value), { zone: "utc" }).setZone("Asia/Manila").toFormat("d LLLL yyyy");
}
export function formatManilaTime(value: Date | string) {
  return DateTime.fromJSDate(value instanceof Date ? value : new Date(value), { zone: "utc" }).setZone("Asia/Manila").toFormat("h:mm a");
}
export function formatManilaDateTime(value: Date | string) {
  return `${formatManilaDate(value)} · ${formatManilaTime(value)}`;
}

