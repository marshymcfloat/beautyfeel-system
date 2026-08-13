import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/auth/login-form";
export const metadata={title:"Staff sign in",robots:{index:false,follow:false}};
export default function LoginPage(){return <main className="grid min-h-[100dvh] place-items-center bg-canvas px-4 py-10"><section className="w-full max-w-md"><BrandMark/><div className="surface-shadow mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-8"><p className="text-sm font-semibold text-brand-800">Private portal</p><h1 className="text-h1 mt-2">Welcome back</h1><p className="mt-3 leading-6 text-ink-muted">Sign in with the account created by Beautyfeel.</p><LoginForm/></div><Link href="/book" className="mx-auto mt-6 flex min-h-11 w-fit items-center text-sm font-semibold text-ink-muted">Return to booking</Link></section></main>}

