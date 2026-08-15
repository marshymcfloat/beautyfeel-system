"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { runAction } from "@/lib/errors/action";
import { DomainError } from "@/lib/errors/domain-error";
import { portalCacheTags } from "@/lib/cache/portal";

export async function markAdminAlertRead(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const { alertId } = z.object({ alertId: z.string().uuid() }).parse(input);
    await prisma.$transaction([
      prisma.adminAlert.update({ where: { id: alertId }, data: { readAt: new Date(), acknowledgedAt: new Date(), acknowledgedById: actor.id } }),
      prisma.auditLog.create({ data: { actorId: actor.id, action: "ADMIN_ALERT_READ", entityType: "AdminAlert", entityId: alertId } }),
    ]);
    updateTag(portalCacheTags.alerts);
    return { alertId };
  });
}

export async function resolveAdminAlert(input:unknown){return runAction(async()=>{const actor=await requireActor(["OWNER"]);const{alertId}=z.object({alertId:z.string().uuid()}).parse(input);await prisma.$transaction([prisma.adminAlert.update({where:{id:alertId},data:{readAt:new Date(),acknowledgedAt:new Date(),acknowledgedById:actor.id,resolvedAt:new Date()}}),prisma.auditLog.create({data:{actorId:actor.id,action:"ADMIN_ALERT_RESOLVED",entityType:"AdminAlert",entityId:alertId}})]);updateTag(portalCacheTags.alerts);return{alertId}})}

export async function retryFailedSms(input:unknown){return runAction(async()=>{const actor=await requireActor(["OWNER"]);const{smsId}=z.object({smsId:z.string().uuid()}).parse(input);const result=await prisma.$transaction(async tx=>{const sms=await tx.smsOutbox.findUnique({where:{id:smsId}});if(!sms||!(sms.status==="FAILED"||sms.status==="RETRY"))throw new DomainError("INVALID_STATE","Only failed SMS messages can be retried.");await tx.smsOutbox.update({where:{id:smsId},data:{status:"RETRY",nextAttemptAt:new Date(),lastErrorCode:null}});await tx.auditLog.create({data:{actorId:actor.id,action:"SMS_RETRY_REQUESTED",entityType:"SmsOutbox",entityId:smsId}});return{smsId}});updateTag(portalCacheTags.alerts);return result})}
