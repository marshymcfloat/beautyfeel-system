import "server-only";
import { getServerEnv } from "@/lib/env/server";
import type { SmsMessage, SmsProvider, SmsSendResult } from "./provider";

type SemaphoreResponse = { message_id?: number | string; status?: string };

export class SemaphoreSmsProvider implements SmsProvider {
  async send(message: SmsMessage): Promise<SmsSendResult> {
    const env = getServerEnv();
    if (!env.SEMAPHORE_API_KEY) throw new Error("SMS_NOT_CONFIGURED");
    const response = await fetch("https://api.semaphore.co/api/v4/messages", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        apikey: env.SEMAPHORE_API_KEY,
        number: message.recipientE164,
        message: message.body,
        sendername: env.SEMAPHORE_SENDER_NAME,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`SMS_HTTP_${response.status}`);
    const payload = (await response.json()) as SemaphoreResponse[] | { message?: string };
    const first = Array.isArray(payload) ? payload[0] : undefined;
    if (!first?.message_id || first.status?.toLowerCase() === "failed") {
      throw new Error("SMS_PROVIDER_REJECTED");
    }
    return { providerMessageId: String(first.message_id), status: first.status ?? "Queued" };
  }
}
