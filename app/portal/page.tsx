import { redirect } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
export const instant=false;
export default async function PortalPage(){let actor;try{actor=await requireActor()}catch{redirect("/login")}if(actor.mustChangePassword)redirect("/change-password");redirect(actor.role==="OWNER"?"/portal/owner/home":actor.role==="BOOKING_ASSISTANT"?"/portal/assistant/home":"/login")}
