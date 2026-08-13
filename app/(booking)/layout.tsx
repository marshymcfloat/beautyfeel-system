import { BrandMark } from "@/components/brand-mark";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";

export const metadata = { robots: { index: false, follow: false } };

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100dvh] bg-canvas"><header className="border-b border-line bg-surface"><div className="mx-auto flex min-h-18 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"><BrandMark/><div className="flex min-h-10 items-center gap-2 rounded-xl bg-brand-50 px-3 text-brand-950"><ShieldCheck aria-hidden size={18} weight="duotone"/><span className="text-xs font-semibold">Private booking</span></div></div></header>{children}</div>;
}
