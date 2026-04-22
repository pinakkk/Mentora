"use client";

import Link from "next/link";
import { MoveRight } from "lucide-react";

interface CasestudyMetric {
  value: string;
  label: string;
}

interface CasestudyItem {
  eyebrow: string;
  title: string;
  subtitle: string;
  points: string[];
  metric: CasestudyMetric;
  href: string;
}

interface Casestudy5Props {
  featuredCasestudy: CasestudyItem;
  casestudies: CasestudyItem[];
}

function CaseStudyLink({
  item,
  featured = false,
}: {
  item: CasestudyItem;
  featured?: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={[
        "group block overflow-hidden transition-colors duration-300 ease-out",
        featured
          ? "grid gap-8 px-6 py-8 md:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] md:items-start lg:px-10 lg:py-10 xl:px-14"
          : "flex h-full flex-col justify-between gap-10 px-6 py-8 lg:px-8 lg:py-10",
      ].join(" ")}
    >
      <div className="flex flex-col justify-between gap-8">
        <div className="space-y-5">
          <span className="inline-flex px-0 py-0 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6f58d9]">
            {item.eyebrow}
          </span>
          <div>
            <h3
              className={[
                "max-w-xl font-heading font-bold tracking-tight text-[#16132a]",
                featured ? "text-3xl leading-tight sm:text-4xl" : "text-2xl leading-tight sm:text-3xl",
              ].join(" ")}
            >
              {item.title}
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#5f5a7a] sm:text-base">
              {item.subtitle}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {item.points.map((point, index) => (
              <div
                key={point}
                className="border-b border-black/8 px-0 py-3 text-sm font-medium text-[#2e2948]"
              >
                <span className="mr-2 text-xs font-semibold text-[#9a8ee8]">
                  0{index + 1}
                </span>
                {point}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-[#1f1a38]">
            Explore how Mentora helps
            <MoveRight className="h-4 w-4 transition-transform duration-500 ease-out group-hover:translate-x-1" />
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="relative h-full min-h-[260px] border border-black/8 bg-white p-5 text-[#16132a]">
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-black/45">
                  Outcome Snapshot
                </p>
                <p className="mt-3 text-5xl font-bold tracking-tight sm:text-6xl">
                  {item.metric.value}
                </p>
              </div>
              <div className="border border-black/10 px-3 py-1 text-xs font-medium text-black/60">
                Mentora
              </div>
            </div>

            <div className="space-y-3">
              <p className="max-w-xs text-sm leading-6 text-black/65">
                {item.metric.label}
              </p>
              <div className="grid gap-2">
                {item.points.slice(0, 3).map((point) => (
                  <div
                    key={point}
                    className="border-b border-black/8 px-0 py-3 text-sm text-black/72"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function Casestudy5({
  featuredCasestudy,
  casestudies,
}: Casestudy5Props) {
  return (
    <section className="mt-14 sm:mt-16">
      <div className="overflow-hidden border-y border-black/8 bg-white">
        <CaseStudyLink item={featuredCasestudy} featured />

        <div className="grid border-t border-black/8 lg:grid-cols-2">
          {casestudies.map((item, index) => (
            <div
              key={item.title}
              className={index === 1 ? "border-t border-black/8 lg:border-l lg:border-t-0" : ""}
            >
              <CaseStudyLink item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
