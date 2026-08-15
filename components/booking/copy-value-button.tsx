"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Check, Copy } from "@phosphor-icons/react";

gsap.registerPlugin(useGSAP);

export function CopyValueButton({ value, label }: { value: string; label: string }) {
  const button = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  useGSAP(() => {
    if (!copied || !button.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(button.current, { scale: 0.96 }, { scale: 1, duration: 0.35, ease: "back.out(2)" });
  }, { dependencies: [copied] });

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return <button ref={button} type="button" onClick={copy} className="flex min-h-11 items-center gap-1.5 rounded-lg border border-[#e7d6aa] bg-white/70 px-3 text-xs font-semibold text-[#4f3c0d] transition-colors hover:bg-white" aria-live="polite">
    {copied ? <Check aria-hidden size={15} weight="bold" /> : <Copy aria-hidden size={15} />}
    {copied ? "Copied" : `Copy ${label}`}
  </button>;
}
