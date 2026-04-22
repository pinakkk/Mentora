import type { Metadata } from "next";
import Link from "next/link";
import { Nunito } from "next/font/google";
import { FadeIn } from "@/components/fade-in";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Database,
  GitBranch,
  Layers3,
  MonitorSmartphone,
  ServerCog,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works | Mentora",
  description:
    "System documentation for Mentora covering architecture, memory, project diagrams, and product flowcharts.",
};

const pageSections = [
  { id: "vision", title: "Vision & Value Proposition" },
  { id: "feature-map", title: "Feature Map" },
  { id: "architecture", title: "Agentic AI Architecture" },
  { id: "technical-design", title: "Technical & System Design" },
  { id: "memory-rag", title: "Memory & RAG Architecture" },
  { id: "frontend-flow", title: "Frontend Experience Flow" },
  { id: "system-flow", title: "System Flow Diagrams" },
  { id: "deployment", title: "Deployment Strategy" },
];

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const features = [
  {
    code: "F1",
    title: "Resume Deep Dive",
    description:
      "Uploads are analyzed to extract skill evidence, highlight gaps, and build the first student profile.",
    owner: "Diagnostic Agent",
  },
  {
    code: "F4",
    title: "Personalized Prep Plans",
    description:
      "2, 4, and 8 week plans are tuned to target companies, deadlines, and the student’s weakest areas.",
    owner: "Planner Agent",
  },
  {
    code: "F6",
    title: "Coaching Chat With Memory",
    description:
      "Multi-turn coaching recalls past sessions, pending tasks, and prior interview failures before responding.",
    owner: "Orchestrator + Memory",
  },
  {
    code: "F9",
    title: "TPC Escalation",
    description:
      "At-risk students trigger admin-facing alerts with context, patterns, and suggested intervention steps.",
    owner: "Escalation Agent",
  },
];

const memoryLayers = [
  {
    title: "Working Memory",
    detail:
      "Current conversation state, active tools, and retrieved context for the live response cycle.",
  },
  {
    title: "Episodic Memory",
    detail:
      "Recent session summaries, hot facts, and short-term progress signals for follow-up continuity.",
  },
  {
    title: "Semantic Memory",
    detail:
      "Long-term facts, vector embeddings, and structured evidence used to personalize plans over time.",
  },
];

const stack = [
  ["Framework", "Next.js App Router"],
  ["UI", "React 19 + Tailwind CSS v4"],
  ["AI", "Claude agents + Vercel AI SDK"],
  ["Data", "Supabase PostgreSQL + pgvector"],
  ["Cache", "Redis / hot memory layer"],
  ["Deploy", "Vercel"],
];

const deployment = [
  ["Vercel", "Next.js hosting and edge delivery", "Hobby / starter"],
  ["Supabase", "Postgres, auth, vector storage", "Free / scalable"],
  ["Redis", "Short-term cache and task coordination", "Free / starter"],
  ["Anthropic / OpenAI", "Reasoning and embeddings", "Usage-based"],
];

export default function HowItWorksPage() {
  return (
    <main
      className={`min-h-screen bg-[#fcfbf9] text-neutral-800 ${nunito.variable} font-[family-name:var(--font-nunito)]`}
    >
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <FadeIn>
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          
          <div className="mb-14 max-w-8=9xl">
            <h2 className="text-3xl font-bold leading-relaxed text-neutral-900">
              Agentic AI career coach blueprint with project diagrams, system flowcharts, and product architecture. This documentation provides an overview of the implementation, architecture, and deployment strategy for Mentora.
            </h2>
          </div>
        </FadeIn>

        <div className="flex flex-col items-start gap-12 lg:flex-row">
          <aside className="sticky top-24 w-full shrink-0 lg:w-64">
            <FadeIn delay={0.2}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-900">
                Table of Contents
              </h3>
              <nav className="flex flex-col gap-3 border-l border-neutral-200">
                {pageSections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block -ml-[1px] border-l-2 border-transparent pl-4 text-sm text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-900"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </FadeIn>
          </aside>

          <div className="flex-1 max-w-[700px] space-y-16">
            <Section id="vision" title="Vision & Value Proposition">
              <h3 className="mb-2 text-lg font-semibold text-neutral-900">The Problem</h3>
              <p className="mb-6 text-sm leading-relaxed text-neutral-700">
                Students usually get reactive, stateless guidance. Generic tools score resumes or answer questions,
                but they do not remember progress, reprioritize plans, or intervene when momentum drops.
              </p>
              <div className="space-y-4">
                <Card title="The Tool Trap">
                  Focused point solutions help with one step, but the larger placement journey stays disconnected.
                </Card>
                <Card title="The Chatbot Trap">
                  A chatbot responds well in the moment, but it does not persist context or act like a mentor.
                </Card>
              </div>
              
              <h3 className="mb-2 mt-8 text-lg font-semibold text-neutral-900">The Solution</h3>
              <p className="text-sm leading-relaxed text-neutral-700">
                Mentora runs a multi-agent coaching system that diagnoses readiness, builds plans, tracks execution,
                adapts mock interviews, and escalates risk signals through shared memory.
              </p>
            </Section>

            <Section id="feature-map" title="Feature Map">
              <div className="space-y-3">
                {features.map((feature) => (
                  <div
                    key={feature.code}
                    className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:flex-row sm:items-start"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-xs font-medium text-neutral-500">
                      {feature.code}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-neutral-900">{feature.title}</h3>
                      <p className="mt-1 text-sm text-neutral-600">{feature.description}</p>
                      <span className="mt-2 inline-block text-xs font-medium text-neutral-400">
                        {feature.owner}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="architecture" title="Agentic AI Architecture">
              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <StatCard icon={Brain} title="6 Specialized Agents" text="Each agent owns one responsibility instead of mixing planning, coaching, and memory." />
                <StatCard icon={GitBranch} title="Central Orchestrator" text="Events are routed to the right agent with controlled handoffs and shared context." />
                <StatCard icon={Database} title="Persistent Memory" text="Student history is stored once and reused across coaching, planning, and alerts." />
              </div>

              <DiagramBlock
                label="Architecture Map"
                code={`                         +-----------------------------+
                         |     AGENT ORCHESTRATOR      |
                         | routes events + handoffs    |
                         +-------------+---------------+
                                       |
          +------------+---------------+---------------+------------+
          |            |               |               |            |
      +---v---+    +---v---+       +---v---+       +---v---+    +---v---+
      |Diag.  |    |Planner|       |Mock   |       |Account|    |Escal. |
      |Agent  |    |Agent  |       |Agent  |       |Agent  |    |Agent  |
      +---+---+    +---+---+       +---+---+       +---+---+    +---+---+
          |            |               |               |            |
          +------------+---------------+---------------+------------+
                                       |
                               +-------v--------+
                               |  Memory Agent  |
                               | Postgres + vec |
                               +----------------+`}
              />
            </Section>

            <Section id="technical-design" title="Technical & System Design">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ServerCog className="h-4 w-4 text-neutral-400" />
                    <h3 className="text-sm font-medium text-neutral-900">Core Stack</h3>
                  </div>
                  <div className="space-y-2 text-sm text-neutral-600">
                    {stack.map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4 border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
                        <span className="text-neutral-500">{label}</span>
                        <span className="text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Layers3 className="h-4 w-4 text-neutral-400" />
                    <h3 className="text-sm font-medium text-neutral-900">Request Lifecycle</h3>
                  </div>
                  <div className="space-y-2 text-sm text-neutral-600">
                    <p>1. User event enters the orchestrator.</p>
                    <p>2. Relevant memory and current context are loaded.</p>
                    <p>3. A specialist agent executes reasoning and tools.</p>
                    <p>4. Output is stored back into memory and returned to UI.</p>
                    <p>5. Risk or milestone signals can trigger follow-up actions.</p>
                  </div>
                </div>
              </div>
            </Section>

            <Section id="memory-rag" title="Memory & RAG Architecture">
              <div className="space-y-3">
                {memoryLayers.map((layer, index) => (
                  <div key={layer.title} className="flex gap-4 rounded-lg border border-neutral-200 bg-white p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-xs font-medium text-neutral-500">
                      0{index + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-neutral-900">{layer.title}</h3>
                      <p className="mt-1 text-sm text-neutral-600">{layer.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <DiagramBlock
                label="Memory Injection Flow"
                code={`User action
   |
   v
Recent chat ----------+
Student facts --------+--> retrieval --> ranked context --> agent prompt
Plan status ----------+
Company targets ------+
   |
   v
Response + updated facts + next tasks`}
              />
            </Section>

            <Section id="frontend-flow" title="Frontend Experience Flow">
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <Card title="Student Interface" icon={MonitorSmartphone}>
                  Streaming chat, resume upload, skill visuals, mock interview panels, and progress-aware reminders.
                </Card>
                <Card title="Admin Interface" icon={ServerCog}>
                  Batch readiness cards, skill-gap heatmaps, escalation alerts, and intervention recommendations.
                </Card>
              </div>

              <DiagramBlock
                label="UI Flowchart"
                code={`Landing page
   |
   +--> Login / onboarding
            |
            +--> Resume + profile intake
                      |
                      +--> Diagnostic summary
                      |
                      +--> Plan builder
                      |
                      +--> Practice room
                      |
                      +--> Dashboard + nudges`}
              />
            </Section>

            <Section id="system-flow" title="System Flow Diagrams">
              <div className="grid gap-6">
                <DiagramBlock
                  label="Student Journey"
                  code={`Resume upload -> Diagnostic Agent -> Profile + gaps
                               |
                               v
                         Planner Agent
                               |
                               v
                    Daily tasks + interview prep
                               |
                               v
                    Mock Agent scores performance
                               |
                 +-------------+-------------+
                 |                           |
                 v                           v
          improved readiness          risk / missed goals
                                               |
                                               v
                                        Escalation Agent`}
                />
                <DiagramBlock
                  label="Architecture Signal Flow"
                  code={`Frontend event -> API route -> Orchestrator
                               |
                               v
                        memory retrieval
                               |
                               v
                    specialist agent reasoning
                               |
                               +--> tools / analysis
                               |
                               v
                     response + memory writes
                               |
                               v
                        streamed back to UI`}
                />
              </div>
            </Section>

            <Section id="deployment" title="Deployment Strategy">
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-700">
                  <tr>
                    <th className="px-4 py-3 font-medium">Service</th>
                    <th className="px-4 py-3 font-medium">Purpose</th>
                    <th className="px-4 py-3 font-medium">Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-600">
                  {deployment.map(([service, purpose, tier]) => (
                    <tr key={service}>
                      <td className="px-4 py-3 font-medium text-neutral-900">{service}</td>
                      <td className="px-4 py-3">{purpose}</td>
                      <td className="px-4 py-3">{tier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <div className="pt-8 text-center sm:text-left">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--landing-accent)] transition hover:opacity-80"
            >
              Launch the product
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32">
      <FadeIn>
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-neutral-900">
          {title}
        </h2>
        {children}
      </FadeIn>
    </section>
  );
}

function Card({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 text-neutral-400" /> : null}
        <h3 className="text-sm font-medium text-neutral-900">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-neutral-600">{children}</p>
    </div>
  );
}

function DiagramBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 shadow-sm">
      <div className="border-b border-neutral-200 bg-white px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
          {label}
        </span>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-neutral-700">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <Icon className="h-5 w-5 text-neutral-400" />
      <h3 className="mt-3 text-sm font-medium text-neutral-900">{title}</h3>
      <p className="mt-1 text-sm text-neutral-600">{text}</p>
    </div>
  );
}

