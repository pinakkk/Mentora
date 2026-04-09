"use client";

import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  Brain,
  Target,
  MessageSquare,
  BookOpen,
  ArrowRight,
  Star,
  CheckCircle2,
  Sparkles,
  Play,
  ArrowUpRight,
} from "lucide-react";
import LandingNavbar from "@/components/landing-navbar";
import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/primitives/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/primitives/accordion";
import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";

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
function useAnimatedCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !hasStarted) setHasStarted(true); },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let n = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      n += step;
      if (n >= target) { setCount(target); clearInterval(id); }
      else setCount(Math.floor(n));
    }, 16);
    return () => clearInterval(id);
  }, [hasStarted, target, duration]);

  return { count, ref };
}

/* ── typewriter ──────────────────────────────────────────── */
function useTypewriter(texts: string[], speed = 60, deleteSpeed = 30, pause = 2200) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const full = texts[idx];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting && text === full) t = setTimeout(() => setDeleting(true), pause);
    else if (deleting && text === "") { setDeleting(false); setIdx((i) => (i + 1) % texts.length); }
    else t = setTimeout(() => setText(deleting ? full.slice(0, text.length - 1) : full.slice(0, text.length + 1)), deleting ? deleteSpeed : speed);
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
    <div ref={containerRef} className="min-h-screen" style={{ background: "var(--surface)" }}>
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
  const typed = useTypewriter(["Software Engineer", "Data Analyst", "Product Manager", "UX Designer", "DevOps Engineer"], 70, 40, 2500);

  const [msgs, setMsgs] = useState([
    { role: "ai" as const, text: "Hey Priya! TCS posted a new JD — your match is 81%. They need SQL.", vis: false },
    { role: "user" as const, text: "That's amazing! Show me the plan.", vis: false },
    { role: "ai" as const, text: "I remember you struggled with JOINs. Day 1 starts there. Plan adjusted.", vis: false },
  ]);

  useEffect(() => {
    const ts = msgs.map((_, i) => setTimeout(() => setMsgs((p) => p.map((m, j) => j === i ? { ...m, vis: true } : m)), 1200 + i * 1000));
    return () => ts.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
                <SectionEyebrow>AI-powered Career Coach</SectionEyebrow>
              </motion.div>

              <motion.h1 variants={fadeUp} className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-gray-900">
                Your career deserves
                <br />
                prep that actually{" "}
                <span className="italic text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #7c5bf0, #a78bfa)" }}>
                  works.
                </span>
              </motion.h1>

              <motion.div variants={fadeUp} className="flex items-center gap-2 text-gray-400 text-base sm:text-lg">
                <span>Preparing for</span>
                <span className="text-gray-900 font-medium min-w-[180px] sm:min-w-[220px]">
                  {typed}<span className="animate-pulse" style={{ color: "var(--landing-accent)" }}>|</span>
                </span>
              </motion.div>

              <motion.p variants={fadeUp} className="text-base sm:text-lg text-gray-500 max-w-md leading-relaxed">
                Real-time AI coaching, practice tailored to your dream company,
                and offers — faster. No cheating, just proven prep.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4">
                <Link href="/login">
                  <Button size="lg" className="rounded-full px-7 sm:px-8 py-6 text-sm sm:text-base text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-shadow" style={{ background: "var(--landing-accent)" }}>
                    Start Free Mock Interview
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/research" className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition text-sm group">
                  <span className="h-10 w-10 rounded-full border border-gray-300 flex items-center justify-center group-hover:border-gray-400 transition">
                    <Play className="h-3.5 w-3.5 ml-0.5 text-gray-500" />
                  </span>
                  Research
                </Link>
              </motion.div>

              {/* social proof */}
              <motion.div variants={fadeUp} className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2">
                  {["PS", "RM", "AI", "VP"].map((ini, i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-medium" style={{ background: "rgba(124,91,240,0.1)", color: "var(--landing-accent)" }}>
                      {ini}
                    </div>
                  ))}
                </div>
                <p className="text-sm"><span className="text-gray-700 font-medium">500+ students</span> <span className="text-gray-400">placed this year</span></p>
              </motion.div>
            </motion.div>

            {/* Right ─ chat card */}
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] as const }} className="relative hidden sm:block" data-speed="0.3">
              <TiltCard>
                <div className="rounded-2xl p-5 sm:p-6 border shadow-xl bg-white" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  {/* header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c5bf0,#a78bfa)" }}>
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">PlaceAI Coach</p>
                      <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-emerald-400" /><p className="text-xs text-gray-400">Online now</p></div>
                    </div>
                  </div>
                  {/* messages */}
                  <div className="space-y-3 min-h-[190px]">
                    <AnimatePresence>
                      {msgs.map((m, i) => m.vis && (
                        <motion.div key={i} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }} className={cn("rounded-xl p-3 max-w-[85%]", m.role === "ai" ? "text-gray-700" : "ml-auto text-white")} style={m.role === "user" ? { background: "var(--landing-accent)" } : { background: "var(--surface)" }}>
                          <p className="text-sm leading-relaxed">{m.text}</p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  {/* typing dots */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex gap-1">{[0, 1, 2].map((i) => (<motion.div key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--landing-accent)" }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />))}</div>
                    <span className="text-xs text-gray-400">AI is thinking...</span>
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
  const items = [
    "MOCK INTERVIEWS",
    "RESUME ANALYSIS",
    "SKILL DIAGNOSTICS",
    "PERSONALIZED PLANS",
    "AI COACHING",
    "COMPANY PREP",
    "REAL-TIME FEEDBACK",
    "PLACEMENT TRACKING",
  ];

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
  const features = [
    { icon: Brain, title: "AI Career Coach", desc: "6 specialized agents that think, decide, and act — collaborating through shared memory to understand your unique journey.", color: "#7c5bf0", light: "rgba(124,91,240,0.08)" },
    { icon: Target, title: "Resume Deep Dive", desc: "AI-powered analysis with skill gap detection. Cross-references your claims with evidence and suggests improvements.", color: "#10b981", light: "rgba(16,185,129,0.08)" },
    { icon: MessageSquare, title: "Mock Interviews", desc: "Company-specific, adaptive difficulty simulations with rubric-based scoring and real-time feedback.", color: "#8b5cf6", light: "rgba(139,92,246,0.08)" },
    { icon: BookOpen, title: "Personalized Plans", desc: "2/4/8-week prep plans mapped to your target companies, dynamically adjusting as you progress.", color: "#f59e0b", light: "rgba(245,158,11,0.08)" },
  ];

  return (
    <section id="features" className="py-24 sm:py-28" style={{ background: "var(--surface)" }} data-nav-theme="light">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center space-y-4 mb-16 sm:mb-20">
          <motion.div variants={fadeUp}>
            <SectionEyebrow>Platform Overview</SectionEyebrow>
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Ethical AI Coaching, Built for
            <br />
            <span className="italic">Real Job Offers</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 max-w-2xl mx-auto text-base sm:text-lg">
            Real skill growth, not memorized answers. PlaceAI delivers honest, goal-focused placement prep.
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8" data-reveal>
          {/* feature list */}
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} onClick={() => setActive(i)} className={cn("flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300", active === i ? "text-white shadow-lg" : "bg-white/80 hover:bg-white border-black/[0.06]")} style={active === i ? { background: "#1a1a2e", borderColor: "#1a1a2e" } : undefined}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: active === i ? "rgba(255,255,255,0.12)" : f.light }}>
                  <f.icon className="h-5 w-5" style={{ color: active === i ? "white" : f.color }} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{f.title}</p>
                  <AnimatePresence mode="wait">
                    {active === i && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-sm mt-1 leading-relaxed" style={{ color: active === i ? "rgba(255,255,255,0.6)" : undefined }}>
                        {f.desc}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <ArrowUpRight className={cn("h-4 w-4 ml-auto shrink-0 transition-all", active === i ? "text-white/50 rotate-0" : "text-gray-300 -rotate-45")} />
              </div>
            ))}
          </div>

          {/* preview */}
          <TiltCard className="h-full">
            <div className="rounded-2xl p-6 sm:p-8 border h-full flex flex-col" style={{ background: "white", borderColor: "rgba(0,0,0,0.06)" }}>
              <div className="flex items-center gap-2 mb-6">
                <SectionEyebrow className="tracking-[0.22em]">Live Preview</SectionEyebrow>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="flex-1">
                  <div className="rounded-xl p-5 sm:p-6 space-y-4 h-full border" style={{ borderColor: "rgba(0,0,0,0.04)", background: "rgba(124,91,240,0.02)" }}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${features[active].color}, ${features[active].color}aa)` }}>
                        {(() => { const I = features[active].icon; return <I className="h-5 w-5 text-white" />; })()}
                      </div>
                      <div><p className="font-semibold text-sm">{features[active].title}</p><p className="text-xs text-gray-400">Powered by 6 AI agents</p></div>
                    </div>

                    {active === 0 && (
                      <div className="space-y-3">
                        <div className="rounded-lg p-3" style={{ background: "rgba(124,91,240,0.05)" }}><p className="text-sm text-gray-700">Analyzing your profile across 6 dimensions...</p></div>
                        <div className="grid grid-cols-3 gap-2">
                          {["Technical", "Communication", "Problem Solving"].map((s, j) => (
                            <div key={j} className="text-center p-2 rounded-lg" style={{ background: "rgba(124,91,240,0.06)" }}>
                              <p className="text-xs font-medium" style={{ color: "var(--landing-accent)" }}>{s}</p>
                              <p className="text-lg font-bold" style={{ color: "#5b3ec4" }}>{[78, 85, 72][j]}%</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {active === 1 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(16,185,129,0.06)" }}>
                          <span className="text-sm font-medium text-emerald-700">Resume Score</span>
                          <span className="text-lg font-bold text-emerald-700">7.4/10</span>
                        </div>
                        <div className="space-y-2">{[{ l: "Add quantified metrics", t: "fix" }, { l: "Projects well-structured", t: "good" }, { l: "Missing SQL in skills", t: "fix" }].map((item, j) => (<div key={j} className="flex items-center gap-2 text-sm"><div className={cn("h-1.5 w-1.5 rounded-full", item.t === "good" ? "bg-emerald-400" : "bg-amber-400")} /><span className="text-gray-600">{item.l}</span></div>))}</div>
                      </div>
                    )}
                    {active === 2 && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">&quot;Could you explain load balancing vs caching?&quot;</p>
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                          <div className="flex-1 h-8 rounded-lg flex items-center px-3" style={{ background: "rgba(0,0,0,0.03)" }}><span className="text-xs text-gray-400">Type your answer...</span></div>
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "var(--landing-accent)" }}><ArrowRight className="h-3.5 w-3.5 text-white" /></div>
                        </div>
                        <div className="flex gap-2">{["Hint", "Skip", "Example"].map((a) => (<span key={a} className="px-2 py-1 rounded text-[10px] font-medium text-gray-500" style={{ background: "rgba(0,0,0,0.04)" }}>{a}</span>))}</div>
                      </div>
                    )}
                    {active === 3 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm"><span className="text-gray-500">4-week plan for TCS</span><span className="font-medium text-gray-900">Week 2 of 4</span></div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(245,158,11,0.12)" }}><div className="h-full w-[45%] rounded-full" style={{ background: "linear-gradient(90deg,#f59e0b,#fbbf24)" }} /></div>
                        <div className="space-y-2">{["SQL JOINs mastery", "System design basics", "Behavioral prep"].map((t, j) => (<div key={j} className="flex items-center gap-2 text-sm"><CheckCircle2 className={cn("h-4 w-4", j === 0 ? "text-emerald-500" : "text-gray-300")} /><span className={j === 0 ? "text-gray-400 line-through" : "text-gray-700"}>{t}</span></div>))}</div>
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
  const pains = [
    { text: "No more interview anxiety", icon: "😰" },
    { text: "Forget about tricky questions", icon: "🤔" },
    { text: "Stop struggling to structure answers", icon: "📝" },
    { text: "Say bye to ignored applications", icon: "👋" },
    { text: "Skip the lack of feedback", icon: "💬" },
    { text: "Done with salary confusion", icon: "💰" },
    { text: "No more feeling unprepared", icon: "📚" },
    { text: "Break free from low confidence", icon: "💪" },
  ];
  const stats = [
    { value: 65, suffix: "%", label: "less interview anxiety with AI coaching" },
    { value: 50, suffix: "%", label: "faster job placement rate" },
    { value: 70, suffix: "%", label: "more confidence with structured feedback" },
  ];

  return (
    <section className="py-24 sm:py-28" style={{ background: "white" }} data-nav-theme="light">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14 sm:mb-16">
          <motion.div variants={fadeUp}>
            <SectionEyebrow>How We Help</SectionEyebrow>
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-4">
            We Solve Your Placement<br /><span className="italic">Struggles</span>
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-16 sm:mb-20">
          {pains.map((p, i) => (
            <motion.div key={i} variants={fadeUp} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="flex items-center gap-3 p-4 rounded-xl border cursor-default group transition-all hover:shadow-md" style={{ background: "var(--surface)", borderColor: "rgba(0,0,0,0.06)" }}>
              <span className="text-lg">{p.icon}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{p.text}</span>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 sm:gap-6" data-reveal>
          {stats.map((s, i) => {
            const { count, ref } = useAnimatedCounter(s.value);
            return (
              <div key={i} ref={ref} className="text-center p-7 sm:p-8 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "rgba(0,0,0,0.06)" }}>
                <p className="text-5xl md:text-6xl font-bold tracking-tight font-heading">{count}{s.suffix}</p>
                <p className="text-gray-500 mt-3 text-sm">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*                     HOW IT WORKS                           */
/* ─────────────────────────────────────────────────────────── */

function HowItWorksSection() {
  const steps = [
    { num: "01", title: "Discover Skills", desc: "Upload your resume and get AI-powered skill extraction with gap analysis. Our diagnostic agent cross-references your claims with actual evidence.", stat: "70%", statLabel: "discover hidden skill gaps", gradient: "linear-gradient(135deg,#7c5bf0,#a78bfa)", accent: "#7c5bf0" },
    { num: "02", title: "Practice Smart", desc: "Company-specific mock interviews with adaptive difficulty. Get rubric-based scoring and detailed feedback after every session.", stat: "3x", statLabel: "more effective than solo prep", gradient: "linear-gradient(135deg,#7c5bf0,#6d28d9)", accent: "#6d28d9" },
    { num: "03", title: "Get Placed", desc: "Your AI coach tracks progress, adjusts your plan, and proactively alerts you to opportunities that match your profile.", stat: "2x", statLabel: "faster placement rate", gradient: "linear-gradient(135deg,#6d28d9,#7c5bf0)", accent: "#7c5bf0" },
  ];

  return (
    <section id="how-it-works" className="py-24 sm:py-28" style={{ background: "var(--surface)" }} data-nav-theme="light">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16 sm:mb-20">
          <motion.div variants={fadeUp}>
            <SectionEyebrow>How It Works</SectionEyebrow>
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-4">
            Three Simple Steps<br />to <span className="italic">Get Placed</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 max-w-2xl mx-auto mt-4 text-base sm:text-lg">
            Refine skills, master interviews, and show your true potential.
          </motion.p>
        </motion.div>

        <div className="space-y-6">
          {steps.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} data-speed={i % 2 === 0 ? "0.15" : "-0.15"}>
              <div className={cn("grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border transition-shadow duration-500 hover:shadow-xl", i % 2 === 1 ? "lg:grid-flow-dense" : "")} style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                {/* text */}
                <div className={cn("p-8 sm:p-10 lg:p-14 flex flex-col justify-center bg-white", i % 2 === 1 ? "lg:col-start-2" : "")}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-sm font-mono font-semibold" style={{ color: step.accent }}>{step.num}</span>
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs text-gray-400">of 03</span>
                  </div>
                  <h3 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{step.title}</h3>
                  <p className="text-gray-500 mt-4 leading-relaxed max-w-lg">{step.desc}</p>
                  <div className="mt-8 flex items-end gap-2">
                    <span className="text-4xl sm:text-5xl font-bold tracking-tight font-heading">{step.stat}</span>
                    <span className="text-gray-400 text-sm mb-1">{step.statLabel}</span>
                  </div>
                </div>
                {/* visual */}
                <div className={cn("p-8 sm:p-10 lg:p-14 flex items-center justify-center min-h-[260px] sm:min-h-[300px]", i % 2 === 1 ? "lg:col-start-1" : "")} style={{ background: step.gradient }}>
                  <div className="text-center text-white space-y-4">
                    <span className="inline-block rounded-full px-3 py-1 text-xs font-medium" style={{ background: "rgba(255,255,255,0.2)" }}>Step {step.num}</span>
                    <div className="flex justify-center">
                      <div className="flex -space-x-3">{["PS", "RM", "AI", "VP"].map((ini, j) => (
                        <motion.div key={j} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + j * 0.1, type: "spring" }} className="h-10 w-10 rounded-full bg-white/30 border-2 border-white/50 flex items-center justify-center text-xs font-semibold">{ini}</motion.div>
                      ))}</div>
                    </div>
                    <p className="text-white/80 text-sm">Join 500+ students already benefiting</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*                     TESTIMONIALS                           */
/* ─────────────────────────────────────────────────────────── */

function TestimonialsSection() {
  const testimonials = [
    { name: "Priya Sharma", role: "CSE, Final Year", quote: "I used PlaceAI before applying to Infosys — and landed the role! The mock interviews felt so real.", company: "Infosys" },
    { name: "Rahul Mehta", role: "Software Engineer", quote: "AI feedback gave me clarity and confidence. It felt like real interview prep in a safe space.", company: "TCS" },
    { name: "Ananya Iyer", role: "ECE, Pre-final Year", quote: "The proactive nudges kept me on track. When I was slacking, my AI coach reached out first.", company: "Wipro" },
    { name: "Vikram Patel", role: "IT, Final Year", quote: "Finally a tool that actually helps candidates shine. The company-specific prep was game-changing.", company: "Accenture" },
    { name: "Sneha Reddy", role: "CSE, Final Year", quote: "After just two sessions, I improved how I present my projects. Incredible AI feedback loop.", company: "Amazon" },
    { name: "Arjun Das", role: "Mech to IT switch", quote: "PlaceAI identified my transferable skills I didn't even know about. Got placed at Wipro!", company: "Wipro" },
  ];

  return (
    <section id="testimonials" className="py-24 sm:py-28" style={{ background: "white" }} data-nav-theme="light">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 sm:mb-16 gap-6">
          <div>
            <motion.div variants={fadeUp}>
              <SectionEyebrow className="mb-4">Success Stories</SectionEyebrow>
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              500+ Students<br /><span className="italic">Landed Offers Faster</span>
            </motion.h2>
          </div>
          <motion.div variants={fadeUp} className="flex items-center gap-4">
            <div className="flex -space-x-2">{[0, 1, 2, 3].map((i) => (<div key={i} className="h-8 w-8 rounded-full bg-gray-300 border-2 border-white" />))}</div>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: "var(--landing-accent)" }}>You?</span>
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
  const studentFeatures = ["Personalized Mock Rooms", "Resume Optimizer", "Tailored Interview Plans", "Real-time AI Feedback"];
  const adminFeatures = ["AI-Powered Coaching", "Custom Learning Paths", "Recruitment Insights", "University Readiness", "Dedicated B2B Support", "Upskill Talent"];

  return (
    <section id="solutions" className="py-24 sm:py-28" style={{ background: "var(--surface)" }} data-nav-theme="light">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14 sm:mb-16">
          <motion.div variants={fadeUp}>
            <SectionEyebrow>Solutions</SectionEyebrow>
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-4">
            Personalized AI Coaching That<br /><span className="italic">Scales From One to Many</span>
          </motion.h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5 sm:gap-6" data-reveal>
          <TiltCard>
            <div className="rounded-3xl text-white p-8 sm:p-10 space-y-8 h-full" style={{ background: "#1a1a2e" }}>
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xl sm:text-2xl font-bold">Personal AI Coach</h3>
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>01</span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">Your dedicated AI mentor that learns your strengths, weaknesses, and goals.</p>
              <div className="space-y-3">{studentFeatures.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                  <span className="text-sm font-medium text-white/75">{f}</span>
                  <CheckCircle2 className="h-4 w-4" style={{ color: "var(--landing-accent)" }} />
                </div>
              ))}</div>
              <Link href="/login"><Button className="rounded-full bg-white text-gray-950 hover:bg-white/90 mt-2">Boost My Prep <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
            </div>
          </TiltCard>

          <TiltCard>
            <div className="rounded-3xl p-8 sm:p-10 space-y-8 h-full border" style={{ background: "white", borderColor: "rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xl sm:text-2xl font-bold">Batch Admin Dashboard</h3>
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border" style={{ borderColor: "rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.03)" }}>02</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">Manage entire batches with AI insights. Track readiness, identify at-risk students.</p>
              <div className="flex flex-wrap gap-2">{adminFeatures.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium border" style={{ borderColor: "rgba(0,0,0,0.06)", background: "rgba(124,91,240,0.04)" }}>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />{f}
                </span>
              ))}</div>
              <Link href="/login"><Button variant="outline" className="rounded-full mt-2">TPC Dashboard <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
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
  const [tab, setTab] = useState("General");
  const tabs = ["General", "Features", "Interviews & Mock", "Technical", "Support"];
  const faqs: Record<string, { q: string; a: string }[]> = {
    General: [
      { q: "What is PlaceAI?", a: "PlaceAI is an AI-powered platform with 6 specialized agents that help university students prepare for campus placements through personalized coaching, mock interviews, and proactive mentoring." },
      { q: "How does the AI career coach work?", a: "PlaceAI uses 6 specialized AI agents (Diagnostic, Planner, Accountability, Mock Interview, Escalation, Memory) that collaborate through shared memory to provide personalized, context-aware coaching." },
      { q: "Who can benefit from using PlaceAI?", a: "Any university student preparing for campus placements, especially those targeting IT/software companies. TPC coordinators also benefit from the admin dashboard for batch management." },
      { q: "Is PlaceAI suitable for TPC admins as well?", a: "Yes! PlaceAI includes a dedicated TPC Admin Dashboard with batch readiness overview, at-risk student flags, skill-gap heatmaps, and AI-generated insights for the entire batch." },
    ],
    Features: [
      { q: "What makes PlaceAI different from ChatGPT?", a: "Unlike ChatGPT, PlaceAI has persistent memory across sessions, proactively reaches out with nudges and opportunities, creates personalized prep plans, and adapts interviews to specific companies." },
      { q: "How does the memory system work?", a: "PlaceAI uses a 3-layer memory system: working memory (current conversation), episodic memory (recent sessions cached in Redis), and semantic memory (permanent fact storage with vector embeddings in pgvector)." },
    ],
    "Interviews & Mock": [
      { q: "How realistic are the mock interviews?", a: "Very realistic. Our Mock Interview Agent adapts questions based on the specific company's interview pattern, adjusts difficulty in real-time based on your answers, and provides rubric-based scoring with detailed feedback." },
      { q: "Can I practice for specific companies?", a: "Yes! PlaceAI maintains company intelligence cards with extracted requirements, interview patterns, and culture notes. Mock interviews are tailored to each company's specific style." },
    ],
    Technical: [
      { q: "What AI models does PlaceAI use?", a: "PlaceAI uses Claude Sonnet 4.6 for agent reasoning and coaching, Claude Haiku 4.5 for fast fact extraction, and OpenAI text-embedding-3-small for vector embeddings." },
      { q: "Is my data secure?", a: "Yes. All data is stored in Supabase with Row Level Security (RLS). Your conversations and personal data are encrypted and never shared with other users." },
    ],
    Support: [
      { q: "How do I get started?", a: "Sign up with your college email or Google account, upload your resume, and start chatting with your AI coach. The Diagnostic Agent will analyze your profile and create a personalized prep plan." },
      { q: "Is PlaceAI free?", a: "PlaceAI offers a free tier with limited mock interviews and coaching sessions. Premium features include unlimited mocks, advanced analytics, and priority support." },
    ],
  };

  return (
    <section id="faq" className="py-24 sm:py-28" style={{ background: "white" }} data-nav-theme="light">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid lg:grid-cols-[1fr,360px] gap-12 lg:gap-16">
          <div>
            <SectionEyebrow className="mb-4">FAQ</SectionEyebrow>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">Got Questions?<br /><span className="italic">We&apos;ve Got Answers</span></h2>
            <p className="text-gray-500 mt-3 max-w-lg">Can&apos;t find what you&apos;re looking for? Chat with our AI coach — always online.</p>

            <div className="flex gap-2 mt-8 flex-wrap">
              {tabs.map((t) => (
                <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all duration-200", tab === t ? "text-white shadow-md" : "border text-gray-600 hover:bg-gray-100")} style={tab === t ? { background: "var(--landing-accent)" } : { borderColor: "rgba(0,0,0,0.08)", background: "rgba(124,91,240,0.03)" }}>
                  {t}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <Accordion className="mt-6">
                  {(faqs[tab] || []).map((f, i) => (
                    <AccordionItem key={i} value={`item-${i}`}>
                      <AccordionTrigger className="text-left font-medium">{f.q}</AccordionTrigger>
                      <AccordionContent className="text-gray-500">{f.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* contact card */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-3xl text-white p-8 h-fit sticky top-24" style={{ background: "#1a1a2e" }}>
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-6" style={{ background: "rgba(124,91,240,0.2)" }}>
              <MessageSquare className="h-6 w-6" style={{ color: "var(--landing-accent)" }} />
            </div>
            <h3 className="text-xl font-bold font-heading">Still have doubts?</h3>
            <p className="text-white/45 text-sm mt-2">15-min AI coaching session. It remembers everything.</p>
            <Link href="/login"><Button className="rounded-full bg-white text-gray-950 hover:bg-white/90 mt-6 w-full">Talk to AI Coach <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
            <div className="flex items-center gap-2 mt-4"><div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-xs text-white/40">Always available, 24/7</span></div>
          </motion.div>
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
            <SectionEyebrow>Get Started Today</SectionEyebrow>
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-heading text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight">
            Ready to Land Your<br /><span className="italic">Dream Placement?</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 max-w-xl mx-auto text-base sm:text-lg">
            Join hundreds of students who transformed their interview prep with AI-powered coaching.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link href="/login"><Button size="lg" className="rounded-full px-8 sm:px-10 py-6 text-sm sm:text-base shadow-xl text-white" style={{ background: "var(--landing-accent)" }}>Start Practicing Free <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free mock interviews</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Cancel anytime</span>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }} className="mt-16 sm:mt-20">
          <h3 className="font-heading text-7xl sm:text-8xl md:text-[10rem] font-bold tracking-tighter leading-none">
            Place<span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg,#c4b5fd,#7c5bf0)" }}>AI</span>
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
            <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--landing-accent)" }} /><span className="font-heading text-lg font-semibold">PlaceAI</span></div>
            <p className="text-sm text-white/40 max-w-xs leading-relaxed">Your AI-powered placement mentor. 6 agents, one mission — getting you placed.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-white/60">Product</h4>
            <ul className="space-y-3 text-sm text-white/40">
              <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
              <li><Link href="/research" className="hover:text-white transition">Research</Link></li>
              <li><Link href="#solutions" className="hover:text-white transition">Solutions</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-white/60">Resources</h4>
            <ul className="space-y-3 text-sm text-white/40">
              <li><Link href="#faq" className="hover:text-white transition">FAQ</Link></li>
              <li><Link href="#testimonials" className="hover:text-white transition">Success Stories</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-white/60">Connect</h4>
            <ul className="space-y-3 text-sm text-white/40"><li>Built for HackAI 2026</li><li>Powered by Claude AI</li></ul>
          </div>
        </div>
        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <span>&copy; 2026 PlaceAI. Built with AI, for students who dream big.</span>
          <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "var(--landing-accent)" }} /><span className="text-xs">All systems operational</span></div>
        </div>
      </div>
    </footer>
  );
}
