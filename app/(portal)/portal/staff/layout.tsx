import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { StaffNav } from "@/components/portal/staff-nav";
import { SignOutButton } from "@/components/portal/sign-out-button";
import { getCurrentProfile } from "@/lib/auth/session";
export const metadata={title:{default:"Staff portal",template:"%s | Beautyfeel"},robots:{index:false,follow:false}};
export const instant=false;
export default async function StaffLayout({children}:{children:React.ReactNode}){let profile;try{profile=await getCurrentProfile()}catch{redirect("/login")}if(profile.mustChangePassword)redirect("/change-password");if(profile.role!=="STAFF")redirect("/portal");return <div className="min-h-[100dvh] bg-canvas"><header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur-sm"><div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6"><BrandMark href="/portal/staff/today"/><div className="flex items-center gap-3"><span className="hidden text-sm font-semibold text-ink-muted sm:inline">{profile.displayName}</span><SignOutButton/></div></div></header><div className="mx-auto flex max-w-[1440px]"><StaffNav/><main className="min-w-0 flex-1 px-4 py-7 pb-28 sm:px-6 lg:px-8 lg:pb-10">{children}</main></div></div>}
