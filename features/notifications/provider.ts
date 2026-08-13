export type SmsMessage = { recipientE164: string; body: string };
export type SmsSendResult = { providerMessageId: string; status: string };

export interface SmsProvider {
  send(message: SmsMessage): Promise<SmsSendResult>;
}
