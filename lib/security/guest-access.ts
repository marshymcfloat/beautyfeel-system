import "server-only";
import { cookies } from "next/headers";

export function guestCookieName(bookingCode: string) {
  return `bf_guest_${bookingCode.replaceAll("-", "_")}`;
}

export async function getGuestAccessToken(bookingCode: string) {
  return (await cookies()).get(guestCookieName(bookingCode))?.value ?? null;
}

export async function setGuestAccessToken(bookingCode: string, token: string) {
  (await cookies()).set(guestCookieName(bookingCode), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: `/booking/${bookingCode}`,
    maxAge: 60 * 60 * 24 * 45,
  });
}

