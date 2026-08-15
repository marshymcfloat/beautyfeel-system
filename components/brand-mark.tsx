import Image from "next/image";
import Link from "next/link";

export function BrandMark({ href = "/" }: { href?: string }) {
  return <Link href={href} className="group inline-flex min-h-11 items-center gap-2.5 font-semibold tracking-[-.025em] text-brand-950" aria-label="Beautyfeel home">
    <Image src="/logo.png" alt="" width={160} height={160} sizes="(max-width: 639px) 112px, 128px" quality={95} className="size-10 rounded-full border border-line object-cover shadow-[0_8px_20px_-14px_rgba(14,52,53,.55)] transition-transform duration-200 group-active:scale-[.97]" priority />
    <span className="text-[18px]">Beautyfeel</span>
  </Link>;
}
