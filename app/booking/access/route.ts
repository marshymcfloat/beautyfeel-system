import { NextResponse, type NextRequest } from "next/server";
import { getGuestBooking } from "@/features/bookings/queries";
import { guestCookieName } from "@/lib/security/guest-access";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const token = request.nextUrl.searchParams.get("token") ?? "";
  try {
    await getGuestBooking(code, token);
    const destination = new URL(`/booking/${encodeURIComponent(code)}`, request.url);
    const response = NextResponse.redirect(destination, 303);
    response.cookies.set(guestCookieName(code), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: `/booking/${code}`,
      maxAge: 60 * 60 * 24 * 45,
    });
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.redirect(new URL("/book?access=invalid", request.url), 303);
  }
}
