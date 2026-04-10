"use client";

import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  Bot,
  FileSearch,
  Users,
  Route,
  ArrowRight,
  Star,
  CheckCircle2,
  Play,
  ArrowUpRight,
} from "lucide-react";
import LandingNavbar from "@/components/landing-navbar";
import { Casestudy5 } from "@/components/ui/casestudy-5";
import { BotMessageSquareIcon } from "@/components/ui/bot-message-square";
import { Button } from "@/components/primitives/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/primitives/accordion";
import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup } from "@/components/primitives/avatar";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/primitives/tooltip";
import { Open_Sans } from "next/font/google";
import { landingPageText } from "@/config/landing-text";
import type { LandingPageText } from "@/config/landing-text";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

/* ── GSAP (tree-shakeable import) ─────────────────────────── */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ── animation variants ──────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.09 } },
};

type PlatformFeature = {
  icon: typeof Bot;
  title: string;
  desc: string;
  color: string;
  light: string;
  preview: {
    analyzingLabel?: string;
    metricLabels?: readonly string[];
    metricValues?: readonly number[];
    scoreLabel?: string;
    scoreValue?: string;
    checklist?: readonly { l: string; t: "fix" | "good" }[];
    question?: string;
    inputPlaceholder?: string;
    actions?: readonly string[];
    planLabel?: string;
    weekLabel?: string;
    progressWidth?: string;
    tasks?: readonly string[];
  };
};

function SectionEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6f58d9] sm:text-xs",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── animated counter ────────────────────────────────────── */

/* ── typewriter ──────────────────────────────────────────── */
function useTypewriter(texts: string[], speed = 60, deleteSpeed = 30, pause = 2200) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const full = texts[idx];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting && text === full) {
      t = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && text === "") {
      t = setTimeout(() => {
        setDeleting(false);
        setIdx((i) => (i + 1) % texts.length);
      }, 0);
    } else {
      t = setTimeout(
        () => setText(deleting ? full.slice(0, text.length - 1) : full.slice(0, text.length + 1)),
        deleting ? deleteSpeed : speed,
      );
    }
    return () => clearTimeout(t);
  }, [text, deleting, idx, texts, speed, deleteSpeed, pause]);

  return text;
}

/* ── 3D tilt card ────────────────────────────────────────── */
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });

  function onMove(e: React.MouseEvent) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() { mx.set(0); my.set(0); }

  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }} className={cn("will-change-transform", className)}>
      {children}
    </motion.div>
  );
}

/* ── GSAP parallax hook ──────────────────────────────────── */
function useParallax() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* Parallax float on elements with data-speed */
      gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
        const speed = parseFloat(el.dataset.speed || "0");
        gsap.to(el, {
          y: () => speed * ScrollTrigger.maxScroll(window) * -0.05,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5,
            invalidateOnRefresh: true,
          },
        });
      });

      /* Reveal sections */
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
          },
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return containerRef;
}

/* ─────────────────────────────────────────────────────────── */
/*                        MAIN PAGE                           */
/* ─────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const containerRef = useParallax();

  return (
    <div ref={containerRef} className={`min-h-screen home-page-container ${openSans.variable}`} style={{ background: "var(--surface)" }}>
      <style>{`
        .home-page-container p {
          font-family: var(--font-open-sans), "Open Sans", sans-serif;
          font-optical-sizing: auto;
          font-style: normal;
          font-variation-settings: "wdth" 100;
        }
      `}</style>
      <LandingNavbar />
      <HeroSection />
      <InfinityTicker />
      <PlatformOverview />
      <PainPointsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <SolutionsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*                      HERO SECTION                          */
/* ─────────────────────────────────────────────────────────── */

function HeroSection() {
  const typed = useTypewriter([...landingPageText.hero.typedRoles], 70, 40, 2500);

  const ALL_MESSAGES = useMemo(() => [...landingPageText.hero.messages], []);

  type HeroMessage = {
    role: "ai" | "user";
    text: string;
    uniqueId: string;
  };

  const [visibleMsgs, setVisibleMsgs] = useState<HeroMessage[]>([]);

  useEffect(() => {
    let currentIndex = 0;

    const showNextMessage = () => {
      setVisibleMsgs(prev => {
        const nextMsg = ALL_MESSAGES[currentIndex % ALL_MESSAGES.length];
        const updated = [...prev, { ...nextMsg, uniqueId: `${currentIndex}-${Date.now()}` }];
        if (updated.length > 3) {
          updated.shift();
        }
        return updated;
      });
      currentIndex++;
    };

    // Show first message immediately
    showNextMessage();

    // Then interval for the loop
    const interval = setInterval(() => {
      showNextMessage();
    }, 3000);

    return () => clearInterval(interval);
  }, [ALL_MESSAGES]);

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center" data-nav-theme="light">
      {/* Soft lavender background with subtle gradient blobs */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #ede8f5 0%, var(--surface) 100%)" }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_20%,rgba(124,91,240,0.10),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_80%_70%,rgba(167,139,250,0.08),transparent)]" />
      </div>

      <div className="relative z-10 pt-32 pb-24 w-full">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left ─ copy */}
            <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-7">
              <motion.div variants={fadeUp}>
                <SectionEyebrow>{landingPageText.hero.eyebrow}</SectionEyebrow>
              </motion.div>

              <motion.h1 variants={fadeUp} className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.08] text-gray-900">
                {landingPageText.hero.headingStart}
                <br />
                {landingPageText.hero.headingEnd}{" "}
                <span className="italic text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #7c5bf0, #a78bfa)" }}>
                  {landingPageText.hero.headingAccent}
                </span>
              </motion.h1>

              <motion.div variants={fadeUp} className="flex items-center gap-2 text-gray-400 text-sm sm:text-base">
                <span>{landingPageText.hero.preparingLabel}</span>
                <span className="text-gray-900 font-normal min-w-[180px] sm:min-w-[220px]">
                  {typed}<span className="animate-pulse" style={{ color: "var(--landing-accent)" }}>|</span>
                </span>
              </motion.div>

              <motion.p variants={fadeUp} className="text-sm sm:text-base text-gray-500 max-w-md leading-relaxed font-light">
                {landingPageText.hero.description}
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4">
                <Link href="/login">
                  <Button size="lg" className="rounded-full px-7 sm:px-8 py-6 text-sm text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-shadow font-medium" style={{ background: "var(--landing-accent)" }}>
                    {landingPageText.hero.primaryCta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/research" className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition text-sm font-normal group">
                  <span className="h-10 w-10 border border-gray-300 rounded-full flex items-center justify-center group-hover:border-gray-400 transition">
                    <Play className="h-3.5 w-3.5 ml-0.5 text-gray-500" />
                  </span>
                  {landingPageText.hero.secondaryCta}
                </Link>
              </motion.div>

              {/* social proof */}
              <motion.div variants={fadeUp} className="flex items-center gap-4 pt-2">
                <TooltipProvider delay={0}>
                  <AvatarGroup className="flex -space-x-3">
                    {landingPageText.avatars.map((avatar, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger>
                          <Avatar size="sm" className="size-10 sm:size-11 border-2 border-white ring-0 transition-transform hover:-translate-y-1 hover:scale-110 shadow-sm hover:shadow-md cursor-pointer relative z-0 hover:z-10 bg-white">
                            <AvatarImage src={avatar.src} />
                            <AvatarFallback>{avatar.fallback}</AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6} className="font-medium text-[11px]">
                          {avatar.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                </TooltipProvider>
                <div className="flex flex-col justify-center">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{landingPageText.hero.socialProofValue}</p>
                  <p className="text-xs text-gray-500 font-medium tracking-wide">{landingPageText.hero.socialProofLabel}</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right ─ chat card */}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] as const }} className="relative hidden sm:block" data-speed="0.3">
              <TiltCard>
                <div className="rounded-2xl p-5 sm:p-6 border shadow-xl bg-white" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  {/* header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c5bf0,#a78bfa)" }}>
                      <BotMessageSquareIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{landingPageText.hero.coachName}</p>
                      <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-emerald-400" /><p className="text-xs text-gray-400">{landingPageText.hero.coachStatus}</p></div>
                    </div>
                  </div>
                  {/* messages */}
                  <div className="flex flex-col justify-end h-[240px] overflow-hidden relative">
                    {/* Add a subtle top fade mask so disappearing messages blend out nicely */}
                    <div className="absolute top-0 left-0 w-full h-8 z-10 pointer-events-none" style={{ background: "linear-gradient(to bottom, white, transparent)" }} />
                    <div className="space-y-3 flex flex-col justify-end">
                      <AnimatePresence mode="popLayout">
                        {visibleMsgs.map((m) => (
                          <motion.div
                            key={m.uniqueId}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
                            className={cn("rounded-xl p-3 max-w-[85%] shrink-0", m.role === "ai" ? "text-gray-700" : "ml-auto text-white")}
                            style={m.role === "user" ? { background: "var(--landing-accent)" } : { background: "var(--surface)" }}
                          >
                            <p className="text-sm leading-relaxed">{m.text}</p>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                  {/* typing dots */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex gap-1">{[0, 1, 2].map((i) => (<motion.div key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--landing-accent)" }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />))}</div>
                    <span className="text-xs text-gray-400">{landingPageText.hero.thinkingLabel}</span>
                  </div>
                </div>
              </TiltCard>

            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*                    INFINITY TICKER                         */
/* ─────────────────────────────────────────────────────────── */

function InfinityTicker() {
  const items = landingPageText.ticker;

  return (
    <section className="py-5 border-b" style={{ background: "var(--surface)", borderColor: "rgba(0,0,0,0.06)" }} data-nav-theme="light">
      <div className="relative overflow-hidden">
        {/* edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, var(--surface), transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, var(--surface), transparent)" }} />

        <div className="flex animate-slide-left whitespace-nowrap">
          {[...items, ...items].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-6 px-6 text-sm font-semibold tracking-widest text-gray-900/80 uppercase">
              {item}
              <span className="ticker-diamond" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*                   PLATFORM OVERVIEW                        */
/* ─────────────────────────────────────────────────────────── */

function PlatformOverview() {
  const [active, setActive] = useState(0);
  const features: PlatformFeature[] = [
    { icon: Bot, ...landingPageText.platformOverview.features[0] },
    { icon: FileSearch, ...landingPageText.platformOverview.features[1] },
    { icon: Users, ...landingPageText.platformOverview.features[2] },
    { icon: Route, ...landingPageText.platformOverview.features[3] },
  ];

  return (
    <section id="features" className="py-24 sm:py-28" style={{ background: "var(--surface)" }} data-nav-theme="light">
      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center space-y-4 mb-16 sm:mb-20">
          <motion.div variants={fadeUp}>
            <SectionEyebrow>{landingPageText.platformOverview.eyebrow}</SectionEyebrow>
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            {landingPageText.platformOverview.titleStart}
            <br />
            <span className="italic">{landingPageText.platformOverview.titleAccent}</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 max-w-2xl mx-auto text-base sm:text-lg">
            {landingPageText.platformOverview.description}
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8" data-reveal>
          {/* feature list */}
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} onClick={() => setActive(i)} className={cn("flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300", active === i ? "bg-white shadow-[0_8px_30px_rgba(124,91,240,0.12)] border-[#7c5bf0]/30 ring-1 ring-[#7c5bf0]/10" : "bg-white/60 hover:bg-white border-black/[0.04]")}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: active === i ? "rgba(124,91,240,0.1)" : f.light }}>
                  <f.icon className="h-5 w-5" style={{ color: active === i ? "#7c5bf0" : f.color }} />
                </div>
                <div className="min-w-0">
                  <p className={cn("font-semibold", active === i ? "text-gray-900" : "text-gray-700")}>{f.title}</p>
                  <AnimatePresence mode="wait">
                    {active === i && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-sm mt-1 leading-relaxed text-gray-500">
                        {f.desc}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <ArrowUpRight className={cn("h-4 w-4 ml-auto shrink-0 transition-all", active === i ? "text-[#7c5bf0] rotate-0" : "text-gray-300 -rotate-45")} />
              </div>
            ))}
          </div>

          {/* preview */}
          <TiltCard className="h-full">
            <div className="rounded-2xl p-6 sm:p-8 border h-full flex flex-col" style={{ background: "white", borderColor: "rgba(0,0,0,0.06)" }}>
              <div className="flex items-center gap-2 mb-6">
                <SectionEyebrow className="tracking-[0.22em]">{landingPageText.platformOverview.previewEyebrow}</SectionEyebrow>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="flex-1">
                  <div className="rounded-xl p-5 sm:p-6 space-y-4 h-full border" style={{ borderColor: "rgba(0,0,0,0.04)", background: "rgba(124,91,240,0.02)" }}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${features[active].color}, ${features[active].color}aa)` }}>
                        {(() => { const I = features[active].icon; return <I className="h-5 w-5 text-white" />; })()}
                      </div>
                      <div><p className="font-semibold text-sm">{features[active].title}</p><p className="text-xs text-gray-400">{landingPageText.platformOverview.previewPoweredBy}</p></div>
                    </div>

                    {active === 0 && (
                      <div className="space-y-3">
                        <div className="rounded-lg p-3" style={{ background: "rgba(124,91,240,0.05)" }}><p className="text-sm text-gray-700">{features[active].preview.analyzingLabel!}</p></div>
                        <div className="grid grid-cols-3 gap-2">
                          {features[active].preview.metricLabels!.map((s, j) => (
                            <div key={j} className="text-center p-2 rounded-lg" style={{ background: "rgba(124,91,240,0.06)" }}>
                              <p className="text-xs font-medium" style={{ color: "var(--landing-accent)" }}>{s}</p>
                              <p className="text-lg font-bold" style={{ color: "#5b3ec4" }}>{features[active].preview.metricValues![j]}%</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {active === 1 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(16,185,129,0.06)" }}>
                          <span className="text-sm font-medium text-emerald-700">{features[active].preview.scoreLabel!}</span>
                          <span className="text-lg font-bold text-emerald-700">{features[active].preview.scoreValue!}</span>
                        </div>
                        <div className="space-y-2">{features[active].preview.checklist!.map((item, j) => (<div key={j} className="flex items-center gap-2 text-sm"><div className={cn("h-1.5 w-1.5 rounded-full", item.t === "good" ? "bg-emerald-400" : "bg-amber-400")} /><span className="text-gray-600">{item.l}</span></div>))}</div>
                      </div>
                    )}
                    {active === 2 && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">{features[active].preview.question!}</p>
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                          <div className="flex-1 h-8 rounded-lg flex items-center px-3" style={{ background: "rgba(0,0,0,0.03)" }}><span className="text-xs text-gray-400">{features[active].preview.inputPlaceholder!}</span></div>
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "var(--landing-accent)" }}><ArrowRight className="h-3.5 w-3.5 text-white" /></div>
                        </div>
                        <div className="flex gap-2">{features[active].preview.actions!.map((a) => (<span key={a} className="px-2 py-1 rounded text-[10px] font-medium text-gray-500" style={{ background: "rgba(0,0,0,0.04)" }}>{a}</span>))}</div>
                      </div>
                    )}
                    {active === 3 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm"><span className="text-gray-500">{features[active].preview.planLabel!}</span><span className="font-medium text-gray-900">{features[active].preview.weekLabel!}</span></div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(245,158,11,0.12)" }}><div className="h-full rounded-full" style={{ width: features[active].preview.progressWidth!, background: "linear-gradient(90deg,#f59e0b,#fbbf24)" }} /></div>
                        <div className="space-y-2">{features[active].preview.tasks!.map((t, j) => (<div key={j} className="flex items-center gap-2 text-sm"><CheckCircle2 className={cn("h-4 w-4", j === 0 ? "text-emerald-500" : "text-gray-300")} /><span className={j === 0 ? "text-gray-400 line-through" : "text-gray-700"}>{t}</span></div>))}</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*                      PAIN POINTS                           */
/* ─────────────────────────────────────────────────────────── */

function PainPointsSection() {
  const painCards = landingPageText.painPoints.cards.map((card) => ({
    ...card,
    points: [...card.points],
    metric: { ...card.metric },
  }));

  return (
    <section className="py-24 sm:py-28" style={{ background: "white" }} data-nav-theme="light">
      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14 sm:mb-16">
          <motion.div variants={fadeUp}>
            <SectionEyebrow>{landingPageText.painPoints.eyebrow}</SectionEyebrow>
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-4">
            {landingPageText.painPoints.titleStart}<br /><span className="italic">{landingPageText.painPoints.titleAccent}</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
            {landingPageText.painPoints.description}
          </motion.p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <Casestudy5
            featuredCasestudy={painCards[0]}
            casestudies={painCards.slice(1)}
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*                     HOW IT WORKS                           */
/* ─────────────────────────────────────────────────────────── */

function HowItWorksSection() {
  const steps = landingPageText.howItWorks.steps;

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden py-24 sm:py-28"
      style={{
        background:
          "radial-gradient(circle at top, rgba(124,91,240,0.12) 0%, rgba(124,91,240,0.05) 24%, rgba(255,255,255,0) 52%), linear-gradient(180deg, #f7f3ff 0%, #fbf9ff 38%, var(--surface) 100%)",
      }}
      data-nav-theme="light"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_68%)]" />
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16 sm:mb-20">
          <motion.div variants={fadeUp}>
            <SectionEyebrow>{landingPageText.howItWorks.eyebrow}</SectionEyebrow>
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-4">
            {landingPageText.howItWorks.titleStart}<br />A <span className="italic">{landingPageText.howItWorks.titleAccent}</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 max-w-2xl mx-auto mt-4 text-base sm:text-lg">
            {landingPageText.howItWorks.description}
          </motion.p>
        </motion.div>

        <div className="space-y-6">
          {steps.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} data-speed={i % 2 === 0 ? "0.15" : "-0.15"}>
              <div
                className={cn(
                  "grid lg:grid-cols-[0.92fr_1.08fr] gap-0 rounded-[32px] overflow-hidden border bg-white/70 shadow-[0_25px_80px_rgba(89,55,179,0.08)] transition-shadow duration-500 hover:shadow-[0_30px_100px_rgba(89,55,179,0.14)]",
                  i % 2 === 1 ? "lg:grid-flow-dense" : "",
                )}
                style={{ borderColor: "rgba(0,0,0,0.06)" }}
              >
                {/* text */}
                <div className={cn("p-8 sm:p-10 lg:p-14 flex flex-col justify-center bg-white", i % 2 === 1 ? "lg:col-start-2" : "")}>
                  <div className="flex items-center gap-3 mb-6">
                    <span
                      className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em]"
                      style={{ color: step.accent, background: `${step.accent}14` }}
                    >
                      {step.num}
                    </span>
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs uppercase tracking-[0.2em] text-gray-400">{step.eyebrow}</span>
                  </div>
                  <h3 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{step.title}</h3>
                  <p className="text-gray-500 mt-4 leading-relaxed max-w-lg">{step.desc}</p>
                  <div className="mt-7 flex flex-wrap gap-2">
                    {step.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium text-gray-600"
                        style={{ borderColor: `${step.accent}20`, background: `${step.accent}10` }}
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                  <div className="mt-8 flex items-end gap-3">
                    <span className="text-4xl sm:text-5xl font-bold tracking-tight font-heading">{step.stat}</span>
                    <span className="text-gray-400 text-sm mb-1 max-w-[180px] leading-snug">{step.statLabel}</span>
                  </div>
                </div>
                {/* visual */}
                <div
                  className={cn(
                    "relative overflow-hidden p-8 sm:p-10 lg:p-14 flex items-center justify-center min-h-[320px] sm:min-h-[360px]",
                    i % 2 === 1 ? "lg:col-start-1" : "",
                  )}
                  style={{ background: step.gradient }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_35%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_30%)]" />
                  <HowItWorksVisual step={step} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksVisual({
  step,
}: {
  step: LandingPageText["howItWorks"]["steps"][number];
}) {
  if (step.visual === "scan") {
    return (
      <div className="relative w-full max-w-[430px] text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto flex h-[250px] w-[250px] items-center justify-center rounded-full border border-white/25 bg-[radial-gradient(circle,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0.08)_50%,transparent_68%)]"
        >
          <div className="absolute inset-5 rounded-full border border-white/20" />
          <div className="absolute inset-12 rounded-full border border-dashed border-white/20" />
          {step.visualData.orbitLabels.map((label: string, index: number) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + index * 0.08 }}
              className={cn(
                "absolute rounded-full border border-white/25 bg-white/12 px-3 py-1.5 text-[11px] font-medium backdrop-blur-sm",
                ["-left-2 top-10", "right-0 top-16", "left-5 bottom-8", "right-4 bottom-14"][index],
              )}
            >
              {label}
            </motion.div>
          ))}
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.34em] text-white/70">{step.visualData.summaryEyebrow}</p>
            <p className="mt-3 font-heading text-5xl font-bold tracking-tight">{step.visualData.summaryValue}</p>
            <p className="mt-2 text-sm text-white/80">{step.visualData.summaryLabel}</p>
          </div>
        </motion.div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {step.visualData.metrics.map(([label, value], index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 + index * 0.08 }}
              className="rounded-2xl border border-white/20 bg-white/12 p-3 text-center backdrop-blur-sm"
            >
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/65">{label}</p>
              <p className="mt-2 text-sm font-semibold text-white">{value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (step.visual === "mock") {
    return (
      <div className="w-full max-w-[430px] text-white">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-[28px] border border-white/20 bg-white/12 p-4 backdrop-blur-md"
        >
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-white/70">
            <span>{step.visualData.topLeft}</span>
            <span>{step.visualData.topRight}</span>
          </div>
          <p className="mt-4 max-w-sm text-xl font-semibold leading-snug text-white">
            {step.visualData.question}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {step.visualData.tags.map((tag: string) => (
              <span key={tag} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/85">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-[26px] border border-white/20 bg-black/10 p-4"
          >
            <p className="text-[11px] uppercase tracking-[0.26em] text-white/65">{step.visualData.responseLabel}</p>
            <div className="mt-4 flex items-end gap-1.5 h-16">
              {step.visualData.waveformHeights.map((height: number, index: number) => (
                <motion.span
                  key={index}
                  initial={{ height: 8 }}
                  whileInView={{ height }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.18 + index * 0.03, duration: 0.35 }}
                  className="w-full rounded-full bg-white/70"
                />
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-white/12 p-3 text-sm leading-relaxed text-white/82">
              {step.visualData.responseFeedback}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="rounded-[26px] border border-white/20 bg-white/12 p-4 backdrop-blur-sm"
          >
            <p className="text-[11px] uppercase tracking-[0.26em] text-white/65">{step.visualData.rubricLabel}</p>
            <div className="mt-4 space-y-3">
              {step.visualData.rubric.map(([label, value]) => (
                <div key={label}>
                  <div className="mb-1 flex items-center justify-between text-sm text-white/82">
                    <span>{label}</span>
                    <span>{value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: value }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {step.visualData.notes.map((note: string) => (
                <span key={note} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#4f2cc8]">
                  {note}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[430px] text-white">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-[28px] border border-white/20 bg-white/12 p-4 backdrop-blur-md"
      >
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-white/70">
          <span>{step.visualData.boardLeft}</span>
          <span>{step.visualData.boardRight}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {step.visualData.companies.map(([company, fit]) => (
            <div key={company} className="rounded-2xl border border-white/15 bg-black/10 p-3">
              <p className="text-sm font-semibold text-white">{company}</p>
              <p className="mt-1 text-xs text-white/70">{fit}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.12 }}
        className="mt-4 rounded-[28px] border border-white/20 bg-black/10 p-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.26em] text-white/65">{step.visualData.routeLabel}</p>
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#155d62]">
            {step.visualData.nextLabel}
          </span>
        </div>
        <div className="mt-5 flex items-center gap-3">
          {step.visualData.routeStages.map((stage: string, index: number) => (
            <div key={stage} className="flex flex-1 items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold",
                  index < 3 ? "border-white/35 bg-white text-[#155d62]" : "border-white/15 bg-white/10 text-white/72",
                )}
              >
                {stage.slice(0, 2)}
              </div>
              {index < 3 && <div className="h-px flex-1 bg-white/30" />}
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl bg-white/12 p-4">
          <p className="text-sm text-white/80">{step.visualData.nudgeTime}</p>
          <p className="mt-2 text-lg font-semibold leading-snug text-white">
            {step.visualData.nudgeMessage}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*                     TESTIMONIALS                           */
/* ─────────────────────────────────────────────────────────── */

function TestimonialsSection() {
  const testimonials = landingPageText.testimonials.items;

  return (
    <section id="testimonials" className="py-24 sm:py-28" style={{ background: "white" }} data-nav-theme="light">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 sm:mb-16 gap-6">
          <div>
            <motion.div variants={fadeUp}>
              <SectionEyebrow className="mb-4">{landingPageText.testimonials.eyebrow}</SectionEyebrow>
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              {landingPageText.testimonials.titleStart}<br /><span className="italic">{landingPageText.testimonials.titleAccent}</span>
            </motion.h2>
          </div>
          <motion.div variants={fadeUp} className="flex items-center gap-4">
            {/* <div className="flex -space-x-2">{[0, 1, 2, 3].map((i) => (<div key={i} className="h-8 w-8 rounded-full bg-gray-300 border-2 border-white" />))}</div>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: "var(--landing-accent)" }}>You?</span> */}
          </motion.div>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div key={i} variants={fadeUp} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="rounded-2xl p-6 border transition-all hover:shadow-lg group" style={{ background: "var(--surface)", borderColor: "rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(124,91,240,0.1)" }}>
                    <span className="text-xs font-semibold" style={{ color: "var(--landing-accent)" }}>{t.name.split(" ").map((n) => n[0]).join("")}</span>
                  </div>
                  <div><p className="font-semibold text-sm">{t.name}</p><p className="text-xs text-gray-400">{t.role}</p></div>
                </div>
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium border" style={{ borderColor: "rgba(124,91,240,0.15)", color: "var(--landing-accent)", background: "rgba(124,91,240,0.05)" }}>{t.company}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex gap-1 mt-4">{[0, 1, 2, 3, 4].map((j) => (<Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />))}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*                       SOLUTIONS                            */
/* ─────────────────────────────────────────────────────────── */

function SolutionsSection() {
  const { studentCard, adminCard } = landingPageText.solutions;

  return (
    <section id="solutions" className="py-24 sm:py-28" style={{ background: "var(--surface)" }} data-nav-theme="light">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14 sm:mb-16">
          <motion.div variants={fadeUp}>
            <SectionEyebrow>{landingPageText.solutions.eyebrow}</SectionEyebrow>
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-4">
            {landingPageText.solutions.titleStart}<br /><span className="italic">{landingPageText.solutions.titleAccent}</span>
          </motion.h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5 sm:gap-6" data-reveal>
          <TiltCard>
            <div className="rounded-3xl p-8 sm:p-10 space-y-8 h-full border-2 border-white shadow-xl shadow-purple-500/5" style={{ background: "var(--surface)" }}>
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-gray-900">{studentCard.title}</h3>
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border-2 border-white shadow-sm" style={{ background: "rgba(124,91,240,0.06)", color: "var(--landing-accent)" }}>{studentCard.label}</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{studentCard.description}</p>
              <div className="space-y-3">{studentCard.features.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border bg-white shadow-sm" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                  <span className="text-sm font-medium text-gray-700">{f}</span>
                  <CheckCircle2 className="h-4 w-4" style={{ color: "var(--landing-accent)" }} />
                </div>
              ))}</div>
              <Link href="/login"><Button className="rounded-full text-white mt-2" style={{ background: "var(--landing-accent)" }}>{studentCard.cta} <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
            </div>
          </TiltCard>

          <TiltCard>
            <div className="rounded-3xl p-8 sm:p-10 space-y-8 h-full border" style={{ background: "white", borderColor: "rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xl sm:text-2xl font-bold">{adminCard.title}</h3>
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border" style={{ borderColor: "rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.03)" }}>{adminCard.label}</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{adminCard.description}</p>
              <div className="flex flex-wrap gap-2">{adminCard.features.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium border" style={{ borderColor: "rgba(0,0,0,0.06)", background: "rgba(124,91,240,0.04)" }}>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />{f}
                </span>
              ))}</div>
              <Link href="/login"><Button variant="outline" className="rounded-full mt-2">{adminCard.cta} <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
            </div>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*                          FAQ                               */
/* ─────────────────────────────────────────────────────────── */

function FAQSection() {
  const faqs = landingPageText.faq.items;
  type FaqTab = (typeof landingPageText.faq.tabs)[number];
  const [tab, setTab] = useState<FaqTab>(
    landingPageText.faq.defaultTab as FaqTab
  );
  const tabs = landingPageText.faq.tabs as readonly FaqTab[];

  return (
    <section id="faq" className="py-24 sm:py-28" style={{ background: "white" }} data-nav-theme="light">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <SectionEyebrow className="mb-4">{landingPageText.faq.eyebrow}</SectionEyebrow>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">{landingPageText.faq.titleStart}<br /><span className="italic">{landingPageText.faq.titleAccent}</span></h2>
          <p className="text-gray-500 mt-3 max-w-lg">{landingPageText.faq.description}</p>

        </div>
        <div className="mt-8 rounded-[28px] border border-black/8 bg-[#fcfbff] p-4 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn("rounded-full px-4 py-2 text-sm font-medium transition-all duration-200", tab === t ? "text-white shadow-md" : "border text-gray-600 hover:bg-gray-100")}
                style={tab === t ? { background: "var(--landing-accent)" } : { borderColor: "rgba(0,0,0,0.08)", background: "rgba(124,91,240,0.03)" }}
              >
                {t}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <Accordion type="single" collapsible className="mt-6 rounded-2xl border border-black/8 bg-white px-5 sm:px-6">
                {faqs[tab].map((f, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="py-2">
                    <AccordionTrigger className="gap-4 py-4 text-left text-base font-medium text-gray-900 hover:no-underline">{f.q}</AccordionTrigger>
                    <AccordionContent className="pb-4 pr-8 text-[15px] leading-7 text-gray-500">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*                          CTA                               */
/* ─────────────────────────────────────────────────────────── */

function CTASection() {
  return (
    <section className="py-24 sm:py-28 relative overflow-hidden" style={{ background: "var(--surface)" }} data-nav-theme="light">
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle,#000 1px,transparent 1px)", backgroundSize: "24px 24px" }} />

      <div className="mx-auto max-w-7xl px-5 sm:px-6 text-center relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-8">
          <motion.div variants={fadeUp}>
            <SectionEyebrow>{landingPageText.cta.eyebrow}</SectionEyebrow>
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight">
            {landingPageText.cta.titleStart}<br /><span className="italic">{landingPageText.cta.titleAccent}</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 max-w-xl mx-auto text-base sm:text-lg">
            {landingPageText.cta.description}
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link href="/login"><Button size="lg" className="rounded-full px-8 sm:px-10 py-6 text-sm sm:text-base shadow-xl text-white" style={{ background: "var(--landing-accent)" }}>{landingPageText.cta.button} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-400">
            {landingPageText.cta.benefits.map((benefit) => (
              <span key={benefit} className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {benefit}</span>
            ))}
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }} className="mt-16 sm:mt-20">
          <h3 className="font-heading text-7xl sm:text-8xl md:text-[10rem] font-bold tracking-tighter leading-none">
            {landingPageText.cta.brandWordmark.slice(0, 5)}<span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg,#c4b5fd,#7c5bf0)" }}>{landingPageText.cta.brandWordmark.slice(5)}</span>
          </h3>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*                        FOOTER                              */
/* ─────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="py-16 sm:py-20 text-white" style={{ background: "#1a1a2e" }} data-nav-theme="dark">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 sm:gap-12 mb-14 sm:mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--landing-accent)" }} /><span className="font-heading text-lg font-semibold">{landingPageText.footer.brand}</span></div>
            <p className="text-sm text-white/40 max-w-xs leading-relaxed">{landingPageText.footer.description}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-white/60">{landingPageText.footer.productTitle}</h4>
            <ul className="space-y-3 text-sm text-white/40">
              {landingPageText.footer.productLinks.map((link) => (
                <li key={link.label}><Link href={link.href} className="hover:text-white transition">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-white/60">{landingPageText.footer.resourcesTitle}</h4>
            <ul className="space-y-3 text-sm text-white/40">
              {landingPageText.footer.resourcesLinks.map((link) => (
                <li key={link.label}><Link href={link.href} className="hover:text-white transition">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-white/60">{landingPageText.footer.connectTitle}</h4>
            <ul className="space-y-3 text-sm text-white/40">{landingPageText.footer.connectItems.map((item) => (<li key={item}>{item}</li>))}</ul>
          </div>
        </div>
        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <span>{landingPageText.footer.copyright}</span>
          <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "var(--landing-accent)" }} /><span className="text-xs">{landingPageText.footer.status}</span></div>
        </div>
      </div>
    </footer>
  );
}
