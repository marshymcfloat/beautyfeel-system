"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, SignOut as SignOutIcon } from "@phosphor-icons/react";
import { signOut } from "@/features/auth/actions";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return <button
    type="button"
    disabled={pending}
    aria-label={pending ? "Signing out" : "Sign out"}
    title="Sign out"
    onClick={() => startTransition(async () => {
      await signOut();
      router.replace("/login");
      router.refresh();
    })}
    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-ink-muted transition hover:bg-brand-50 hover:text-brand-900 active:scale-95 disabled:cursor-wait disabled:opacity-60"
  >
    {pending ? <CircleNotch aria-hidden size={18} className="animate-spin" /> : <SignOutIcon aria-hidden size={18} />}
    <span>{pending ? "Signing out" : "Sign out"}</span>
  </button>;
}
