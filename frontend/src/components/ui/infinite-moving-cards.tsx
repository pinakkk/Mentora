"use client";

import type { CSSProperties } from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type TestimonialItem = {
  quote: string;
  name: string;
  title: string;
  company?: string;
};

export function InfiniteMovingCards({
  items,
  direction = "left",
  speed = "slow",
  className,
}: {
  items: TestimonialItem[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  className?: string;
}) {
  const repeatedItems = [...items, ...items];
  const duration = speed === "fast" ? "18s" : speed === "normal" ? "26s" : "34s";
  const marqueeStyle = {
    animationName: direction === "right" ? "marquee-right" : "marquee-left",
    animationDuration: duration,
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  } as CSSProperties;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />
      <div
        className={cn(
          "flex w-max gap-5 py-2 will-change-transform hover:[animation-play-state:paused]",
        )}
        style={marqueeStyle}
      >
        {repeatedItems.map((item, index) => (
          <article
            key={`${item.name}-${index}`}
            className="w-[300px] shrink-0 rounded-2xl border p-6 transition-transform hover:-translate-y-1"
            style={{ background: "var(--surface)", borderColor: "rgba(0,0,0,0.06)" }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold"
                  style={{ background: "rgba(124,91,240,0.1)", color: "var(--landing-accent)" }}
                >
                  {item.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.title}</p>
                </div>
              </div>
              {item.company ? (
                <span
                  className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium"
                  style={{
                    background: "rgba(124,91,240,0.05)",
                    borderColor: "rgba(124,91,240,0.15)",
                    color: "var(--landing-accent)",
                  }}
                >
                  {item.company}
                </span>
              ) : null}
            </div>
            <p className="text-sm leading-relaxed text-gray-600">&ldquo;{item.quote}&rdquo;</p>
            <div className="mt-4 flex gap-1">
              {[0, 1, 2, 3, 4].map((star) => (
                <Star key={star} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
