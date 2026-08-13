import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { requireActor } from "@/lib/auth/session";
export const metadata={title:"Change password",robots:{index:false,follow:false}};
export const instant=false;
export default async function ChangePasswordPage(){let actor;try{actor=await requireActor()}catch{redirect("/login")}return <main className="grid min-h-[100dvh] place-items-center bg-canvas px-4 py-10"><section className="w-full max-w-md"><BrandMark/><div className="surface-shadow mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-8"><p className="text-sm font-semibold text-brand-800">Account security</p><h1 className="text-h1 mt-2">Create your password</h1><p className="mt-3 leading-6 text-ink-muted">Replace the temporary password before entering the Beautyfeel portal.</p><ChangePasswordForm role={actor.role}/></div></section></main>}
