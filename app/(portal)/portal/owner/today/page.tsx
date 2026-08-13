import { redirect } from "next/navigation";

export const instant = false;

export default function TodayRedirect() {
  redirect("/portal/owner/home");
}
