"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowClockwise } from "@phosphor-icons/react";
import { refreshPortalSections } from "@/features/portal/actions";
import type { PortalSection } from "@/lib/cache/portal";

export function SectionRefreshButton({ sections, label = "Refresh section" }: { sections: PortalSection[]; label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setError(null);
    startTransition(async () => {
      const result = await refreshPortalSections({ sections });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  return <span className="relative inline-flex">
    <button type="button" onClick={refresh} disabled={pending} aria-label={label} title={label} className="grid size-11 place-items-center rounded-xl text-ink-muted transition hover:bg-brand-50 hover:text-brand-900 disabled:cursor-wait disabled:opacity-50">
      <ArrowClockwise aria-hidden size={17} weight="bold" className={pending ? "animate-spin" : ""} />
    </button>
    {error && <span role="alert" className="absolute right-0 top-full z-20 mt-1 w-52 rounded-lg bg-danger px-2 py-1.5 text-[10px] text-white shadow-lg">{error}</span>}
  </span>;
}
