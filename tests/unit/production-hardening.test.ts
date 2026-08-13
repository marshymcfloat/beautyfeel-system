import { describe,expect,it } from "vitest";
import { minimumLeadMinutesForSource, verificationDeadline,redeemCreditBalance } from "@/features/bookings/policy";
import { calculateDepositCentavos } from "@/features/bookings/money";

describe("production hardening policies",()=>{
  it("creates a 60-minute payment verification deadline",()=>{const claimed=new Date("2026-08-12T02:00:00.000Z");expect(verificationDeadline(claimed,60).toISOString()).toBe("2026-08-12T03:00:00.000Z")});
  it("keeps the 20 percent deposit rounded up to a centavo",()=>{expect(calculateDepositCentavos(10001,20)).toBe(2001)});
  it("redeems store credit without allowing overdrafts",()=>{expect(redeemCreditBalance(2000,750)).toBe(1250);expect(()=>redeemCreditBalance(500,501)).toThrow()});
  it("keeps lead time for online bookings but allows immediate owner entries",()=>{expect(minimumLeadMinutesForSource("ONLINE",60)).toBe(60);expect(minimumLeadMinutesForSource("MESSENGER",60)).toBe(0);expect(minimumLeadMinutesForSource("PHONE",60)).toBe(0);expect(minimumLeadMinutesForSource("WALK_IN",60)).toBe(0)});
});
