"use client";

import { motion } from "framer-motion";

import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { cn } from "@/lib/utils";

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

const testimonials = [
  {
    name: "Priya Sharma",
    title: "CSE, Final Year",
    quote: "I used PlaceAI before applying to Infosys and landed the role. The mock interviews felt so real.",
    company: "Infosys",
  },
  {
    name: "Rahul Mehta",
    title: "Software Engineer",
    quote: "AI feedback gave me clarity and confidence. It felt like real interview prep in a safe space.",
    company: "TCS",
  },
  {
    name: "Ananya Iyer",
    title: "ECE, Pre-final Year",
    quote: "The proactive nudges kept me on track. When I was slacking, my AI coach reached out first.",
    company: "Wipro",
  },
  {
    name: "Vikram Patel",
    title: "IT, Final Year",
    quote: "Finally a tool that actually helps candidates shine. The company-specific prep was game-changing.",
    company: "Accenture",
  },
  {
    name: "Sneha Reddy",
    title: "CSE, Final Year",
    quote: "After just two sessions, I improved how I present my projects. Incredible AI feedback loop.",
    company: "Amazon",
  },
  {
    name: "Arjun Das",
    title: "Mech to IT switch",
    quote: "PlaceAI identified my transferable skills I did not even know about. Got placed at Wipro.",
    company: "Wipro",
  },
];

const firstRow = testimonials.slice(0, 3);
const secondRow = testimonials.slice(3);

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

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 sm:py-28" style={{ background: "white" }} data-nav-theme="light">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="mb-14 flex flex-col gap-6 sm:mb-16 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <motion.div variants={fadeUp}>
              <SectionEyebrow className="mb-4">Success Stories</SectionEyebrow>
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              500+ Students
              <br />
              <span className="italic">Landed Offers Faster</span>
            </motion.h2>
          </div>
          <motion.div variants={fadeUp} className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gray-300" />
              ))}
            </div>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ background: "var(--landing-accent)" }}
            >
              You?
            </span>
          </motion.div>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-5">
          <motion.div variants={fadeUp}>
            <InfiniteMovingCards items={firstRow} direction="right" speed="normal" />
          </motion.div>
          <motion.div variants={fadeUp}>
            <InfiniteMovingCards items={secondRow} direction="left" speed="slow" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
