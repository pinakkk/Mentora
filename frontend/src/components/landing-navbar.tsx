"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type NavTheme = "light" | "dark";

function resolveThemeFromPoint({
  x,
  y,
  navEl,
}: {
  x: number;
  y: number;
  navEl: HTMLElement;
}): NavTheme | null {
  const elements = document.elementsFromPoint(x, y);
  for (const el of elements) {
    if (!(el instanceof HTMLElement)) continue;
    if (navEl.contains(el)) continue;
    let node: HTMLElement | null = el;
    while (node) {
      const theme = node.dataset.navTheme;
      if (theme === "light" || theme === "dark") return theme;
      node = node.parentElement;
    }
  }
  return null;
}

export default function LandingNavbar() {
  const navRef = useRef<HTMLElement | null>(null);
  const [theme, setTheme] = useState<NavTheme>("light");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const nav = navRef.current;
      if (!nav) return;
      const rect = nav.getBoundingClientRect();
      const xp = Math.round(window.innerWidth / 2);
      const yp = Math.min(window.innerHeight - 1, Math.round(rect.bottom + 1));
      setTheme(resolveThemeFromPoint({ x: xp, y: yp, navEl: nav }) ?? "light");
      setScrolled(window.scrollY > 8);
    };
    const tick = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    tick();
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    return () => {
      window.removeEventListener("scroll", tick);
      window.removeEventListener("resize", tick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const surface = useMemo(() => {
    if (theme === "dark") {
      return cn(
        "text-white",
        "bg-gray-950/60 supports-[backdrop-filter]:bg-gray-950/50",
        "border-white/10",
        scrolled ? "shadow-2xl shadow-black/30" : "shadow-xl shadow-black/15",
      );
    }
    return cn(
      "text-gray-900",
      "bg-white/70 supports-[backdrop-filter]:bg-white/55",
      "border-black/[0.06]",
      scrolled ? "shadow-lg shadow-black/8" : "shadow-md shadow-black/5",
    );
  }, [scrolled, theme]);

  const linkCls = useMemo(
    () =>
      theme === "dark"
        ? "px-3 py-2 rounded-full text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        : "px-3 py-2 rounded-full text-sm text-gray-500 hover:text-gray-900 hover:bg-black/5 transition-colors",
    [theme],
  );

  const ctaCls = useMemo(
    () =>
      theme === "dark"
        ? "bg-[#8b72f6] text-white hover:bg-[#7a5ff0] shadow-lg shadow-[#8b72f6]/25 ring-1 ring-white/10"
        : "bg-[#8b72f6] text-white hover:bg-[#7a5ff0] shadow-lg shadow-[#8b72f6]/20 ring-1 ring-[#7a5ff0]/10",
    [theme],
  );

  return (
    <nav
      ref={navRef}
      className="fixed top-5 inset-x-0 z-50 flex justify-center px-4 sm:px-6 pointer-events-none"
      aria-label="Primary"
    >
      <div
        className={cn(
          "pointer-events-auto w-full max-w-5xl rounded-full border backdrop-blur-xl px-2 py-2 transition-all duration-300",
          surface,
        )}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center pl-4 pr-3">
            <span className="font-heading text-lg font-semibold tracking-tight">
              PlaceAI
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            <Link href="#features" className={linkCls}>
              Features
            </Link>
            <Link href="/research" className={linkCls}>
              Research
            </Link>
            <Link href="#testimonials" className={linkCls}>
              Stories
            </Link>
            <Link href="#faq" className={linkCls}>
              FAQs
            </Link>
            <Link href="#solutions" className={linkCls}>
              Solutions
            </Link>
          </div>

          <Link
            href="/login"
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors",
              ctaCls,
            )}
          >
            Get Started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
