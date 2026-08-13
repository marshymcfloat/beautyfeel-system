import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Beautyfeel", template: "%s | Beautyfeel" },
  description: "Book skin treatments, massage and spa services, lashes, and nails with Beautyfeel.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en" className={interTight.variable} data-scroll-behavior="smooth"><body className="min-h-[100dvh]"><a href="#main-content" className="skip-link">Skip to main content</a><div id="main-content" tabIndex={-1}>{children}</div></body></html>;
}
