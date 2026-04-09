"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  Target,
  MessageSquare,
  BarChart3,
  Shield,
  BookOpen,
  ArrowRight,
  ChevronDown,
  Star,
  Zap,
  Users,
  GraduationCap,
  Building2,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/primitives/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/primitives/accordion";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
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

// ─── NAVBAR ────────────────────────────────────────────────

function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-gray-950 text-white"
    >
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="text-lg font-semibold tracking-tight">PlaceAI</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-gray-300">
          <Link href="#features" className="hover:text-white transition">
            Features
          </Link>
          <Link href="#how-it-works" className="hover:text-white transition">
            How It Works
          </Link>
          <Link href="#testimonials" className="hover:text-white transition">
            Success Stories
          </Link>
          <Link href="#faq" className="hover:text-white transition">
            FAQs
          </Link>
          <Link href="#solutions" className="hover:text-white transition">
            Solutions
          </Link>
        </div>

        <Link href="/login">
          <Button
            variant="outline"
            className="rounded-full border-gray-700 text-white hover:bg-white hover:text-black transition-all"
          >
            Try for free
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </motion.nav>
  );
}

// ─── HERO ──────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-8"
          >
            <motion.div variants={fadeUp}>
              <Badge
                variant="secondary"
                className="rounded-full px-4 py-1.5 text-sm font-medium"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-400 mr-2" />
                AI-powered Career Coach
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]"
            >
              Confidence
              <br />
              that gets{" "}
              <span className="text-blue-600">you placed</span>
              <br />
              &mdash;not scripts
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg text-gray-500 max-w-md leading-relaxed"
            >
              Get real-time AI coaching, practice tailored to your dream
              company, and land offers faster. No cheating &mdash; just proven
              prep.
            </motion.p>

            <motion.div variants={fadeUp}>
              <Link href="/login">
                <Button
                  size="lg"
                  className="rounded-full px-8 py-6 text-base bg-gray-950 hover:bg-gray-800"
                >
                  Start Free Mock Interview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative rounded-2xl bg-gray-50 p-6 shadow-xl border">
              <div className="rounded-xl bg-white p-4 shadow-sm border space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">PlaceAI Coach</p>
                    <p className="text-xs text-gray-400">Online now</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3 max-w-[80%]">
                    <p className="text-sm text-gray-700">
                      Hey Priya! TCS just posted a new JD. Your match: 81%.
                      They need SQL &mdash; here&apos;s a 3-day crash course I
                      made for you.
                    </p>
                  </div>
                  <div className="bg-blue-600 rounded-lg p-3 max-w-[70%] ml-auto">
                    <p className="text-sm text-white">
                      That&apos;s amazing! Show me the plan.
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 max-w-[85%]">
                    <p className="text-sm text-gray-700">
                      I remember you struggled with JOINs last week. Day 1
                      starts there. I&apos;ve already adjusted your prep plan.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-gray-400">
                  AI is thinking autonomously...
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── PLATFORM OVERVIEW ─────────────────────────────────────

function PlatformOverview() {
  const features = [
    {
      icon: Brain,
      title: "AI Career Coach",
      description: "6 specialized agents that think, decide, and act",
    },
    {
      icon: Target,
      title: "Resume Deep Dive",
      description: "AI-powered analysis with skill gap detection",
    },
    {
      icon: MessageSquare,
      title: "Mock Interviews",
      description: "Company-specific, adaptive difficulty simulations",
    },
    {
      icon: BookOpen,
      title: "Personalized Plans",
      description: "2/4/8-week prep mapped to your target companies",
    },
  ];

  return (
    <section id="features" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center space-y-4 mb-16"
        >
          <motion.div variants={fadeUp}>
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-1.5 text-sm"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-400 mr-2" />
              Platform Overview
            </Badge>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-4xl md:text-5xl font-bold tracking-tight"
          >
            Ethical AI Coaching, Built for
            <br />
            Real Job Offers
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-gray-500 max-w-2xl mx-auto text-lg"
          >
            Our mission is to help students get placed through real skill
            growth, not memorized answers. PlaceAI uses AI to deliver honest,
            goal-focused placement prep.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="space-y-3 max-w-3xl mx-auto mb-16"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="flex items-center gap-4 p-4 rounded-xl border bg-white hover:bg-gray-50 transition cursor-pointer group"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-medium text-gray-900">
                {feature.title}
              </span>
              <span className="text-gray-400 text-sm ml-auto hidden sm:block">
                {feature.description}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Mock Interview Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-6">
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-1.5 text-sm"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-400 mr-2" />
              Interview Training
            </Badge>
            <h3 className="text-2xl font-bold mt-3">
              AI-Powered Mock Interviews
            </h3>
            <p className="text-gray-500 mt-1">
              Train with simulated sessions for real-world readiness
            </p>
          </div>

          <div className="rounded-2xl bg-gray-100 p-8 border">
            <div className="rounded-xl bg-white p-6 shadow-sm border space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="h-10 w-10 rounded-full bg-gray-300 -ml-3" />
              </div>
              <p className="font-medium">Hello, Priya!</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Thank you for joining this interview on System Design. We&apos;ll
                start with some intermediate-level questions to gauge your
                understanding of design principles and practical applications.
                Let&apos;s begin with the first question.
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>
                  Could you explain the concept of load balancing, and how it
                  differs from caching?
                </li>
                <li>
                  Additionally, how do you decide when to prioritize horizontal
                  vs vertical scaling?
                </li>
              </ul>
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" className="rounded-full">
                  Exit
                </Button>
                <Button variant="outline" size="sm" className="rounded-full">
                  Restart
                </Button>
                <Button variant="outline" size="sm" className="rounded-full">
                  Skip
                </Button>
                <Button
                  size="sm"
                  className="rounded-full bg-gray-950 hover:bg-gray-800 ml-auto"
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── PAIN POINTS ───────────────────────────────────────────

function PainPointsSection() {
  const painPoints = [
    "No more interview anxiety",
    "Forget about tricky questions",
    "Stop struggling to structure answers",
    "Say bye to ignored applications",
    "Skip the lack of feedback",
    "Done with salary confusion",
    "No more feeling unprepared",
    "Break free from low confidence",
  ];

  const stats = [
    {
      value: "65%",
      label: "less interview anxiety — AI-powered coaching.",
    },
    {
      value: "50%",
      label: "faster job placement — students land roles quicker.",
    },
    {
      value: "70%",
      label: "more confidence — with structure and feedback.",
    },
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp}>
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-1.5 text-sm"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-400 mr-2" />
              How we help?
            </Badge>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-4xl md:text-5xl font-bold tracking-tight mt-4"
          >
            We Solve Your Placement
            <br />
            Struggles
          </motion.h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="space-y-4"
          >
            {painPoints.map((point, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className={`flex items-center gap-3 ${
                  i === 0
                    ? "text-gray-900 font-semibold text-lg"
                    : "text-gray-400"
                }`}
              >
                {i === 0 && (
                  <div className="h-6 w-0.5 bg-gray-900 rounded-full" />
                )}
                <span>{point}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl bg-gray-200 aspect-[4/3] flex items-center justify-center"
          >
            <div className="text-center space-y-4">
              <GraduationCap className="h-16 w-16 text-gray-400 mx-auto" />
              <p className="text-gray-500 text-sm">
                Students preparing smarter
              </p>
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-8 mt-20"
        >
          {stats.map((stat, i) => (
            <motion.div key={i} variants={fadeUp} className="text-center">
              <p className="text-4xl md:text-5xl font-bold">{stat.value}</p>
              <p className="text-gray-500 mt-2 text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS ──────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Discover Skills",
      description:
        "Upload your resume and get AI-powered skill extraction with gap analysis. Our diagnostic agent cross-references your claims with actual evidence.",
      stat: "70%",
      statLabel: "of students discover hidden skill gaps during this step",
      color: "bg-blue-600",
    },
    {
      num: "02",
      title: "Practice Smart",
      description:
        "Company-specific mock interviews with adaptive difficulty. Get rubric-based scoring and detailed feedback after every session.",
      stat: "3x",
      statLabel: "more effective than practicing alone with question banks",
      color: "bg-emerald-600",
    },
    {
      num: "03",
      title: "Get Placed",
      description:
        "Your AI coach tracks progress, adjusts your plan, and proactively alerts you to opportunities that match your profile.",
      stat: "2x",
      statLabel: "faster placement rate compared to traditional prep",
      color: "bg-purple-600",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-20"
        >
          <motion.div variants={fadeUp}>
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-1.5 text-sm"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-400 mr-2" />
              How It Works
            </Badge>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-4xl md:text-5xl font-bold tracking-tight mt-4"
          >
            Three Simple Steps
            <br />
            to Get Placed
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-gray-500 max-w-2xl mx-auto mt-4"
          >
            Getting placed doesn&apos;t have to be complicated. In just three
            steps, you&apos;ll refine your skills, master interviews, and
            confidently show your true potential.
          </motion.p>
        </motion.div>

        <div className="space-y-24">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`grid lg:grid-cols-2 gap-16 items-center ${
                i % 2 === 1 ? "lg:grid-flow-dense" : ""
              }`}
            >
              <div className={i % 2 === 1 ? "lg:col-start-2" : ""}>
                <p className="text-sm text-gray-400 font-mono mb-2">
                  {step.num} - 03
                </p>
                <h3 className="text-3xl font-bold">{step.title}</h3>
                <p className="text-gray-500 mt-4 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div
                className={`rounded-2xl ${step.color} p-8 text-white ${
                  i % 2 === 1 ? "lg:col-start-1" : ""
                }`}
              >
                <Badge className="bg-white/20 text-white border-0 mb-6">
                  Step {step.num}
                </Badge>
                <p className="text-6xl font-bold mt-4">{step.stat}</p>
                <p className="text-white/80 mt-2">{step.statLabel}</p>
                <div className="flex items-center gap-2 mt-6">
                  <div className="flex -space-x-2">
                    {[0, 1, 2, 3].map((j) => (
                      <div
                        key={j}
                        className="h-8 w-8 rounded-full bg-white/30 border-2 border-white/50"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-white/70">+101</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ──────────────────────────────────────────

function TestimonialsSection() {
  const testimonials = [
    {
      name: "Priya Sharma",
      role: "CSE, Final Year",
      quote:
        "I used PlaceAI before applying to Infosys — and landed the role! The mock interviews felt so real.",
    },
    {
      name: "Rahul Mehta",
      role: "Software Engineer",
      quote:
        "AI feedback gave me clarity and confidence. It felt like real interview prep in a safe space.",
    },
    {
      name: "Ananya Iyer",
      role: "ECE, Pre-final Year",
      quote:
        "The proactive nudges kept me on track. When I was slacking, my AI coach reached out first.",
    },
    {
      name: "Vikram Patel",
      role: "IT, Final Year",
      quote:
        "Finally a tool that actually helps candidates shine. The company-specific prep was game-changing.",
    },
    {
      name: "Sneha Reddy",
      role: "CSE, Final Year",
      quote:
        "The mock interviews felt real. After just two sessions, I improved how I present my projects.",
    },
    {
      name: "Arjun Das",
      role: "Mech to IT switch",
      quote:
        "PlaceAI identified my transferable skills I didn't even know about. Got placed at Wipro!",
    },
  ];

  return (
    <section id="testimonials" className="py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="mb-16"
        >
          <motion.h2
            variants={fadeUp}
            className="text-4xl md:text-5xl font-bold tracking-tight"
          >
            500+ Students
            <br />
            Landed Offers Faster
          </motion.h2>
          <motion.div variants={fadeUp} className="flex items-center gap-4 mt-4">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full bg-gray-300 border-2 border-white"
                />
              ))}
            </div>
            <Badge className="bg-blue-600 text-white border-0 rounded-full">
              You
            </Badge>
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="rounded-2xl bg-white p-6 border hover:shadow-md transition"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-600">
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── SOLUTIONS ─────────────────────────────────────────────

function SolutionsSection() {
  const studentFeatures = [
    "Personalized Mock Rooms",
    "Resume Optimizer",
    "Tailored Interview Plans",
  ];

  const adminFeatures = [
    "AI-Powered Coaching",
    "Custom Learning Paths",
    "Recruitment Insights",
    "University Readiness",
    "Dedicated B2B Support",
    "Upskill Talent",
  ];

  return (
    <section id="solutions" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp}>
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-1.5 text-sm"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-400 mr-2" />
              Solutions
            </Badge>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-4xl md:text-5xl font-bold tracking-tight mt-4"
          >
            Personalized AI Coaching That
            <br />
            Scales From One to Many
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 max-w-2xl mx-auto mt-4">
            Whether you&apos;re preparing for your next career move or managing
            an entire batch, PlaceAI adapts to your needs with tailored coaching
            and actionable insights.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Student Card */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border bg-gray-50 p-8 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Personal AI Coach</h3>
              <Badge variant="secondary" className="rounded-full">
                01
              </Badge>
            </div>
            <div className="space-y-3">
              {studentFeatures.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <span className="text-sm font-medium">{f}</span>
                </div>
              ))}
            </div>
            <Link href="/login">
              <Button className="rounded-full bg-gray-950 hover:bg-gray-800 mt-4">
                Boost My Prep
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          {/* TPC Admin Card */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border bg-gray-50 p-8 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">
                Boost Your Batch&apos;s Hiring
              </h3>
              <Badge variant="secondary" className="rounded-full">
                02
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {adminFeatures.map((f, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="rounded-full px-3 py-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mr-1.5" />
                  {f}
                </Badge>
              ))}
            </div>
            <Link href="/login">
              <Button
                variant="outline"
                className="rounded-full mt-4"
              >
                TPC Dashboard
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── FAQ ───────────────────────────────────────────────────

function FAQSection() {
  const [activeTab, setActiveTab] = useState("General");
  const tabs = [
    "General",
    "Features",
    "Interviews & Mock",
    "Technical",
    "Support",
  ];

  const faqs: Record<string, { q: string; a: string }[]> = {
    General: [
      {
        q: "What is PlaceAI?",
        a: "PlaceAI is an AI-powered platform with 6 specialized agents that help university students prepare for campus placements through personalized coaching, mock interviews, and proactive mentoring.",
      },
      {
        q: "How does the AI career coach work?",
        a: "PlaceAI uses 6 specialized AI agents (Diagnostic, Planner, Accountability, Mock Interview, Escalation, Memory) that collaborate through shared memory to provide personalized, context-aware coaching.",
      },
      {
        q: "Who can benefit from using PlaceAI?",
        a: "Any university student preparing for campus placements, especially those targeting IT/software companies. TPC coordinators also benefit from the admin dashboard for batch management.",
      },
      {
        q: "Is PlaceAI suitable for TPC admins as well?",
        a: "Yes! PlaceAI includes a dedicated TPC Admin Dashboard with batch readiness overview, at-risk student flags, skill-gap heatmaps, and AI-generated insights for the entire batch.",
      },
    ],
    Features: [
      {
        q: "What makes PlaceAI different from ChatGPT?",
        a: "Unlike ChatGPT, PlaceAI has persistent memory across sessions, proactively reaches out with nudges and opportunities, creates personalized prep plans, and adapts interviews to specific companies.",
      },
      {
        q: "How does the memory system work?",
        a: "PlaceAI uses a 3-layer memory system: working memory (current conversation), episodic memory (recent sessions cached in Redis), and semantic memory (permanent fact storage with vector embeddings in pgvector).",
      },
    ],
    "Interviews & Mock": [
      {
        q: "How realistic are the mock interviews?",
        a: "Very realistic. Our Mock Interview Agent adapts questions based on the specific company's interview pattern, adjusts difficulty in real-time based on your answers, and provides rubric-based scoring with detailed feedback.",
      },
      {
        q: "Can I practice for specific companies?",
        a: "Yes! PlaceAI maintains company intelligence cards with extracted requirements, interview patterns, and culture notes. Mock interviews are tailored to each company's specific style.",
      },
    ],
    Technical: [
      {
        q: "What AI models does PlaceAI use?",
        a: "PlaceAI uses Claude Sonnet 4.6 for agent reasoning and coaching, Claude Haiku 4.5 for fast fact extraction, and OpenAI text-embedding-3-small for vector embeddings.",
      },
      {
        q: "Is my data secure?",
        a: "Yes. All data is stored in Supabase with Row Level Security (RLS). Your conversations and personal data are encrypted and never shared with other users.",
      },
    ],
    Support: [
      {
        q: "How do I get started?",
        a: "Sign up with your college email or Google account, upload your resume, and start chatting with your AI coach. The Diagnostic Agent will analyze your profile and create a personalized prep plan.",
      },
      {
        q: "Is PlaceAI free?",
        a: "PlaceAI offers a free tier with limited mock interviews and coaching sessions. Premium features include unlimited mocks, advanced analytics, and priority support.",
      },
    ],
  };

  return (
    <section id="faq" className="py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-[1fr,380px] gap-16">
          <div>
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-1.5 text-sm mb-4"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-400 mr-2" />
              FAQ
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight">
              Got Questions? We&apos;ve Got Answers
            </h2>
            <p className="text-gray-500 mt-3 max-w-lg">
              Preempt objections about ethics, effectiveness, and features.
              Can&apos;t find what you&apos;re looking for? Chat with our AI!
            </p>

            <div className="flex gap-2 mt-8 flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm transition ${
                    activeTab === tab
                      ? "bg-gray-950 text-white"
                      : "bg-white border text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <Accordion className="mt-6">
              {(faqs[activeTab] || []).map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left font-medium">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-500">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-white border p-8 h-fit sticky top-24"
          >
            <h3 className="text-xl font-bold">Have doubts?</h3>
            <p className="text-gray-500 text-sm mt-1">
              Set up a brief 15-min session
            </p>
            <Link href="/login">
              <Button className="rounded-full bg-gray-950 hover:bg-gray-800 mt-6 w-full">
                Talk to AI Coach
              </Button>
            </Link>
            <div className="flex items-center gap-2 mt-4">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-gray-400">Always available</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ───────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="space-y-6"
        >
          <motion.div variants={fadeUp}>
            <Badge
              variant="secondary"
              className="rounded-full px-4 py-1.5 text-sm"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-400 mr-2" />
              Quick Look
            </Badge>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-4xl md:text-5xl font-bold tracking-tight"
          >
            See the Platform in Action
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-gray-500 max-w-2xl mx-auto"
          >
            Watch how PlaceAI helps you refine your skills, practice real
            interviews, and gain the confidence to land your dream placement.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link href="/login">
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-base bg-gray-950 hover:bg-gray-800"
              >
                Start Practicing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16"
        >
          <p className="text-gray-400 text-sm mb-4">Practice smarter.</p>
          <h3 className="text-7xl md:text-9xl font-bold tracking-tighter">
            Place<span className="text-gray-400">AI</span>
          </h3>
        </motion.div>
      </div>
    </section>
  );
}

// ─── FOOTER ────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-gray-950 text-white py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-lg font-semibold">PlaceAI</span>
            </div>
            <p className="text-sm text-gray-400 max-w-xs">
              Your AI-powered placement mentor. 6 agents, one mission &mdash;
              getting you placed.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="#features" className="hover:text-white transition">
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="hover:text-white transition"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="#solutions"
                  className="hover:text-white transition"
                >
                  Solutions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="#faq" className="hover:text-white transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="#testimonials"
                  className="hover:text-white transition"
                >
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Built for HackAI 2026</li>
              <li>Powered by Claude AI</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-gray-500 text-center">
          &copy; 2026 PlaceAI. Built with AI, for students who dream big.
        </div>
      </div>
    </footer>
  );
}
