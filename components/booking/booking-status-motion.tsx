"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

gsap.registerPlugin(useGSAP);

export function BookingStatusMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo("main > header, main > .mt-5 > section, main > .mt-5 > div, main > p", { autoAlpha: 0, y: 16 }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.08,
        ease: "power3.out",
        clearProps: "transform,opacity,visibility",
      });
    });
    return () => media.revert();
  }, { scope });

  return <div ref={scope}>{children}</div>;
}
