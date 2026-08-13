type SmsPayload = { bookingCode?: string; customerName?: string; startsAt?: string; message?: string };

function appointment(value?: string): string {
  if (!value) return "your selected schedule";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function firstName(value?: string): string {
  return value?.trim().split(/\s+/)[0]?.slice(0, 30) || "there";
}

export function renderSms(eventType: string, payload: SmsPayload): string {
  const code = payload.bookingCode ?? "your booking";
  if (eventType === "CONFIRMED") {
    return `Hi ${firstName(payload.customerName)}! Thank you for choosing Beautyfeel. Your appointment is confirmed for ${appointment(payload.startsAt)}. See you then!`;
  }
  if (eventType === "REJECTED") return `Beautyfeel: We could not verify the deposit for ${code}. Please contact us for assistance.`;
  if (eventType === "REMINDER") return `Hi ${firstName(payload.customerName)}! A friendly reminder: your Beautyfeel appointment is on ${appointment(payload.startsAt)}. We look forward to seeing you!`;
  if (eventType === "REMINDER_30M") return `Hi ${firstName(payload.customerName)}! Your Beautyfeel appointment starts in about 30 minutes at ${appointment(payload.startsAt)}. We're ready for you—see you soon!`;
  if (eventType === "STAFFING_ALERT") return `Beautyfeel staffing alert: ${payload.message ?? `${code} still needs assigned staff.`}`;
  if (eventType === "PAYMENT_CLAIM") return `Beautyfeel payment claim: ${code}. ${payload.message ?? "Open the owner portal to verify it."}`;
  if (eventType === "PAYMENT_OVERDUE") return `Beautyfeel urgent: ${code} has waited over 60 minutes for payment verification.`;
  throw new Error("UNKNOWN_SMS_EVENT");
}
