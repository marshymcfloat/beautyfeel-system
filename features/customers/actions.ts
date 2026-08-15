"use server";
import { z } from "zod";
import { updateTag } from "next/cache";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { runAction } from "@/lib/errors/action";
import { normalizePhilippinePhone } from "@/lib/security/phone";
import { DomainError } from "@/lib/errors/domain-error";
import { redeemCreditBalance } from "@/features/bookings/policy";
import { bookingCacheTag, portalCacheTags } from "@/lib/cache/portal";

const trustSchema=z.object({phone:z.string().min(10).max(30),status:z.enum(["NORMAL","TRUSTED","BLOCKED"]),reason:z.string().trim().max(500).nullable().optional(),blockedUntil:z.coerce.date().nullable().optional()});
export async function updateCustomerTrust(input:unknown){return runAction(async()=>{const actor=await requireActor(["OWNER"]);const data=trustSchema.parse(input);const phoneE164=normalizePhilippinePhone(data.phone);const profile=await prisma.$transaction(async tx=>{const saved=await tx.customerTrustProfile.upsert({where:{phoneE164},create:{phoneE164,status:data.status,blockReason:data.reason,blockedUntil:data.blockedUntil,ownerNote:data.reason},update:{status:data.status,blockReason:data.status==="BLOCKED"?data.reason:null,blockedUntil:data.status==="BLOCKED"?data.blockedUntil:null,ownerNote:data.reason}});await tx.auditLog.create({data:{actorId:actor.id,action:`CUSTOMER_${data.status}`,entityType:"CustomerTrustProfile",entityId:saved.id,metadata:{reason:data.reason??null}}});return saved});updateTag(portalCacheTags.trustProfiles);return profile})}

export async function redeemStoreCredit(input:unknown){return runAction(async()=>{const actor=await requireActor(["OWNER"]);const data=z.object({creditId:z.string().uuid(),bookingId:z.string().uuid(),amountCentavos:z.number().int().positive()}).parse(input);const result=await prisma.$transaction(async tx=>{const[credit,booking]=await Promise.all([tx.storeCredit.findUnique({where:{id:data.creditId}}),tx.booking.findUnique({where:{id:data.bookingId}})]);if(!credit||!booking||credit.customerPhoneE164!==booking.customerPhoneE164||credit.status!=="ACTIVE"||credit.expiresAt<=new Date())throw new DomainError("VALIDATION_ERROR","Store credit cannot be applied.");const remaining=redeemCreditBalance(credit.remainingCentavos,data.amountCentavos);await tx.storeCredit.update({where:{id:credit.id},data:{remainingCentavos:remaining,status:remaining===0?"USED":"ACTIVE",usedAt:remaining===0?new Date():null}});await tx.auditLog.create({data:{actorId:actor.id,action:"STORE_CREDIT_REDEEMED",entityType:"StoreCredit",entityId:credit.id,metadata:{bookingId:booking.id,amountCentavos:data.amountCentavos}}});return{creditId:credit.id,remainingCentavos:remaining}});updateTag(portalCacheTags.customers);updateTag(bookingCacheTag(data.bookingId));return result})}
