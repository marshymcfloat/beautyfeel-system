import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100dvh] bg-canvas"><PublicHeader/>{children}<PublicFooter/></div>;
}

