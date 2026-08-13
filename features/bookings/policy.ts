export function verificationDeadline(claimedAt:Date,slaMinutes:number){if(!Number.isInteger(slaMinutes)||slaMinutes<1)throw new Error("Invalid verification SLA");return new Date(claimedAt.getTime()+slaMinutes*60_000)}
export function redeemCreditBalance(remainingCentavos:number,amountCentavos:number){if(!Number.isInteger(amountCentavos)||amountCentavos<=0||amountCentavos>remainingCentavos)throw new Error("Invalid store-credit amount");return remainingCentavos-amountCentavos}
type BookingSource="ONLINE"|"MESSENGER"|"PHONE"|"WALK_IN";
export function minimumLeadMinutesForSource(source:BookingSource,configuredMinimum:number){return source==="ONLINE"?configuredMinimum:0}
