import { createHash } from "node:crypto";

export function phoneToAuthEmail(phoneE164: string): string {
  const digest = createHash("sha256").update(`beautyfeel-auth:${phoneE164}`).digest("hex").slice(0, 32);
  return `phone-${digest}@login.beautyfeel.app`;
}
