"use server";
import { markDepositSent } from "@/features/bookings/actions";
import { requestCustomerCancellation as cancelCustomerBooking } from "@/features/bookings/service";
import { getGuestAccessToken } from "@/lib/security/guest-access";
import { runAction } from "@/lib/errors/action";
import { z } from "zod";
export async function claimBookingDeposit(bookingCode:string,paymentReference?:string|null){const token=await getGuestAccessToken(bookingCode);if(!token)return {ok:false as const,error:{code:"NOT_FOUND" as const,message:"Your private booking access has expired."}};return markDepositSent({bookingCode,guestToken:token,paymentReference});}
export async function requestCustomerCancellation(bookingCode:string,reason:string){const token=await getGuestAccessToken(bookingCode);if(!token)return {ok:false as const,error:{code:"NOT_FOUND" as const,message:"Your private booking access has expired."}};return runAction(()=>cancelCustomerBooking(bookingCode,token,z.string().trim().min(3).max(500).parse(reason)));}
