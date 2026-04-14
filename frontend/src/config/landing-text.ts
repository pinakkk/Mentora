export const landingPageText = {
  avatars: [
    {
      src: "https://pbs.twimg.com/profile_images/1948770261848756224/oPwqXMD6_400x400.jpg",
      fallback: "SK",
      tooltip: "Skyleen",
    },
    {
      src: "https://pbs.twimg.com/profile_images/1593304942210478080/TUYae5z7_400x400.jpg",
      fallback: "CN",
      tooltip: "Shadcn",
    },
    {
      src: "https://pbs.twimg.com/profile_images/1677042510839857154/Kq4tpySA_400x400.jpg",
      fallback: "AW",
      tooltip: "Adam Wathan",
    },
    {
      src: "https://pbs.twimg.com/profile_images/1783856060249595904/8TfcCN0r_400x400.jpg",
      fallback: "GR",
      tooltip: "Guillermo Rauch",
    },
    {
      src: "https://pbs.twimg.com/profile_images/1534700564810018816/anAuSfkp_400x400.jpg",
      fallback: "JH",
      tooltip: "Jhey",
    },
    {
      src: "https://pbs.twimg.com/profile_images/1927474594102784000/Al0g-I6o_400x400.jpg",
      fallback: "DH",
      tooltip: "David Haz",
    },
  ],
  hero: {
    eyebrow: "6-Agent Agentic AI Career Coach",
    headingStart: "Your placement prep deserves",
    headingEnd: "a coach that actually",
    headingAccent: "remembers you.",
    preparingLabel: "Coaching for",
    typedRoles: [
      "Software Engineer",
      "Data Analyst",
      "Product Manager",
      "DevOps Engineer",
      "System Designer",
    ],
    description:
      "6 specialized AI agents that think, decide, and act — proactive nudges, company-specific mock interviews, adaptive prep plans, and a coach that never starts from scratch.",
    primaryCta: "Start Free Mock Interview",
    secondaryCta: "See How It Works",
    socialProofValue: "500+ students",
    socialProofLabel: "placed this year",
    coachName: "PlaceAI Coach",
    coachStatus: "Online now",
    thinkingLabel: "Agent is thinking...",
    messages: [
      { role: "ai" as const, text: "Hey Priya! TCS posted a new JD — your match is 82%. They need SQL and you're at 3/10." },
      { role: "user" as const, text: "That's great — what's the plan?" },
      { role: "ai" as const, text: "I remember you struggled with JOINs last week. I've built a 3-day SQL crash course and rescheduled your arrays session." },
      { role: "user" as const, text: "How long is the full prep plan?" },
      { role: "ai" as const, text: "4 weeks targeting Wipro, TCS, and Amazon. First mock interview is scheduled for tomorrow at 10 AM." },
      { role: "user" as const, text: "Perfect. I'll review my notes tonight." },
    ],
  },
  ticker: [
    "6 AI AGENTS",
    "MOCK INTERVIEWS",
    "RESUME DEEP DIVE",
    "SKILL DIAGNOSTICS",
    "PERSONALIZED PLANS",
    "PROACTIVE NUDGES",
    "COMPANY INTEL",
    "REAL-TIME FEEDBACK",
    "TPC DASHBOARD",
    "MEMORY SYSTEM",
    "PLACEMENT TRACKING",
    "BURNOUT DETECTION",
  ],
  platformOverview: {
    eyebrow: "Platform Overview",
    titleStart: "Agentic AI Coaching Built for",
    titleAccent: "Real Placement Offers",
    description:
      "Not a chatbot. Not a question bank. PlaceAI runs 6 specialized agents that collaborate through shared memory — diagnosing, planning, practicing, and following through until you're placed.",
    previewEyebrow: "Live Preview",
    previewPoweredBy: "Powered by 6 AI agents",
    features: [
      {
        title: "Diagnostic Agent",
        desc: "Parses your resume, audits GitHub and LinkedIn, runs micro-assessments, and computes a verified skill profile — cross-referencing your claims with real evidence.",
        color: "#7c5bf0",
        light: "rgba(124,91,240,0.08)",
        preview: {
          analyzingLabel: "Verifying your profile across 6 dimensions...",
          metricLabels: ["Technical", "Communication", "Problem Solving"],
          metricValues: [78, 85, 72],
        },
      },
      {
        title: "Resume Deep Dive",
        desc: "AI-powered analysis with skill-gap detection, ATS scoring, and evidence-backed suggestions. Flags unverified claims and surfaces what recruiters actually look for.",
        color: "#10b981",
        light: "rgba(16,185,129,0.08)",
        preview: {
          scoreLabel: "Resume Score",
          scoreValue: "7.4/10",
          checklist: [
            { l: "Add quantified impact metrics", t: "fix" as const },
            { l: "Projects well-structured", t: "good" as const },
            { l: "SQL missing from skills section", t: "fix" as const },
          ],
        },
      },
      {
        title: "Mock Interview Agent",
        desc: "Company-specific, adaptive simulations across Technical, Behavioral, HR, and System Design rounds — with live rubric scoring and per-answer coaching cues.",
        color: "#8b5cf6",
        light: "rgba(139,92,246,0.08)",
        preview: {
          question: '"Walk me through a project you shipped under pressure."',
          inputPlaceholder: "Type your answer...",
          actions: ["Hint", "Skip", "Rubric"],
        },
      },
      {
        title: "Planner + Accountability",
        desc: "2/4/8-week prep plans mapped to your target companies — dynamically adjusted as your scores, deadlines, and gaps evolve. The Accountability Agent follows up so you don't fall behind.",
        color: "#f59e0b",
        light: "rgba(245,158,11,0.08)",
        preview: {
          planLabel: "4-week plan · TCS + Wipro + Amazon",
          weekLabel: "Week 2 of 4",
          progressWidth: "45%",
          tasks: ["SQL JOINs mastery", "Tree traversal practice", "STAR behavioral prep"],
        },
      },
    ],
  },
  painPoints: {
    eyebrow: "How We Help",
    titleStart: "We Solve Your Placement",
    titleAccent: "Struggles",
    description:
      "Clearer prep, verified skill signals, and an AI that follows through — at every stage of placement season.",
    cards: [
      {
        eyebrow: "Interview Confidence",
        title: "No more interview anxiety or blank-mind moments.",
        subtitle:
          "PlaceAI runs adaptive mock rooms calibrated to each company's real interview patterns. You practice the exact round types — Technical, Behavioral, HR, and System Design — until they feel routine.",
        points: [
          "Company-specific question banks",
          "Adaptive difficulty in real-time",
          "Live rubric scoring per answer",
          "Coaching cues after every response",
        ],
        metric: {
          value: "65%",
          label: "less interview anxiety with structured AI coaching",
        },
        href: "/login",
      },
      {
        eyebrow: "Application Clarity",
        title: "Get noticed instead of getting ignored.",
        subtitle:
          "Resume evidence checks, skill-gap heatmaps, and a Selection Probability Engine tell you exactly which companies to prioritize and what to fix before applying.",
        points: [
          "ATS-optimized resume analysis",
          "Match score per company with actionable levers",
          "Slot and tier awareness for Indian campus placements",
          "Smart application strategy recommendations",
        ],
        metric: {
          value: "50%",
          label: "faster placement rate with targeted prep",
        },
        href: "#how-it-works",
      },
      {
        eyebrow: "Accountability & Direction",
        title: "Replace drifting with real placement momentum.",
        subtitle:
          "The Accountability Agent tracks every task, follows up on missed commitments, and escalates to your TPC coordinator if you go silent — so no student falls through the cracks.",
        points: [
          "Proactive nudges before every deadline",
          "Escalation Agent alerts TPC for at-risk students",
          "Burnout and frustration detection",
          "Strategy switches when current approach stops working",
        ],
        metric: {
          value: "70%",
          label: "more follow-through with agentic accountability",
        },
        href: "#solutions",
      },
    ],
  },
  howItWorks: {
    eyebrow: "How It Works",
    titleStart: "Not a checklist.",
    titleAccent: "A placement feedback loop.",
    description:
      "Diagnose where you stand, train under real pressure, and let the agent loop keep momentum alive until the right offer arrives.",
    steps: [
      {
        num: "01",
        eyebrow: "Signal Mapping",
        title: "Turn your resume into a verified readiness blueprint.",
        desc:
          "The Diagnostic Agent parses your resume, audits your GitHub activity, and cross-references your LinkedIn — then runs micro-assessments to verify self-reported skills. You get a proof-backed profile, not guesswork.",
        stat: "12",
        statLabel: "career signals mapped in your first scan",
        gradient: "linear-gradient(135deg,#5b2dd8 0%,#8f6dff 55%,#f6b66b 120%)",
        accent: "#6f58d9",
        highlights: ["Resume evidence check", "Skill-gap heatmap", "Role-fit baseline"],
        visual: "scan" as const,
        visualData: {
          orbitLabels: ["SQL gap", "DSA strong", "ATS fit 81%", "1 weak project"],
          summaryEyebrow: "Readiness map",
          summaryValue: "78%",
          summaryLabel: "profile confidence after first scan",
          metrics: [
            ["Skills", "14 mapped"],
            ["Proof", "9 verified"],
            ["Gaps", "3 urgent"],
          ],
        },
      },
      {
        num: "02",
        eyebrow: "Pressure Practice",
        title: "Train in a mock room that actually adapts to you.",
        desc:
          "The Mock Interview Agent uses each company's historical interview pattern, shifts difficulty in real-time based on your answers, and scores you on a rubric — Technical, Behavioral, HR, or System Design. Every session updates your skill profile.",
        stat: "3",
        statLabel: "live rubrics running during each mock round",
        gradient: "linear-gradient(135deg,#1f113f 0%,#5b2dd8 48%,#f0679b 120%)",
        accent: "#f0679b",
        highlights: ["Adaptive interview flow", "Live rubric scoring", "Instant coaching cues"],
        visual: "mock" as const,
        visualData: {
          topLeft: "Mock room",
          topRight: "Round 02",
          question: '"Walk me through a project you shipped under pressure."',
          tags: ["Behavioral", "STAR answer", "Amazon LP"],
          responseLabel: "Your response",
          responseFeedback:
            "Strong ownership story. Add the measurable impact earlier and tighten the final outcome — the Result part of STAR was vague.",
          rubricLabel: "Live rubric",
          rubric: [
            ["Clarity", "84%"],
            ["STAR Structure", "76%"],
            ["Impact", "71%"],
          ],
          notes: ["Stronger opening", "Good specifics", "Needs concrete result"],
          waveformHeights: [18, 34, 28, 46, 38, 58, 41, 26, 47, 36, 52, 30],
        },
      },
      {
        num: "03",
        eyebrow: "Momentum Engine",
        title: "From better prep to better shots at real offers.",
        desc:
          "The Planner and Accountability Agents keep the loop alive — adjusting your plan when scores change, nudging you before deadlines, and alerting your TPC coordinator if you go silent. The Escalation Agent is your safety net.",
        stat: "24/7",
        statLabel: "agentic follow-through from plan to shortlist",
        gradient: "linear-gradient(135deg,#123b5b 0%,#1d7b83 50%,#d3ff72 125%)",
        accent: "#1d7b83",
        highlights: ["Selection probability engine", "Proactive deadline nudges", "TPC escalation alerts"],
        visual: "launch" as const,
        visualData: {
          boardLeft: "Opportunity engine",
          boardRight: "Live tracking",
          companies: [
            ["TCS", "82% fit"],
            ["Wipro", "74% fit"],
            ["Accenture", "68% fit"],
            ["Amazon", "51% fit"],
          ],
          routeLabel: "Prep route",
          nextLabel: "Next: SQL mock · Due tonight",
          routeStages: ["Diagnose", "Practice", "Mock", "Apply"],
          nudgeTime: "Accountability Agent nudge · 8:30 PM",
          nudgeMessage: "Your TCS match jumps to 87% if you finish one SQL round tonight. 15 minutes — let's go.",
        },
      },
    ],
  },
  testimonials: {
    eyebrow: "Success Stories",
    titleStart: "500+ Students",
    titleAccent: "Landed Offers Faster",
    items: [
      {
        name: "Priya Sharma",
        role: "CSE, Final Year",
        quote: "The AI remembered every session. Before Wipro's drive it told me exactly what they test — I walked in confident and got the offer.",
        company: "Wipro",
      },
      {
        name: "Rahul Mehta",
        role: "Software Engineer",
        quote: "The rubric-based mock feedback was nothing like generic prep sites. It knew my weak spots and drilled them every session.",
        company: "TCS",
      },
      {
        name: "Ananya Iyer",
        role: "ECE, Pre-final Year",
        quote: "When I went silent for a week, the AI flagged it to my coordinator. That accountability was the push I needed to finish prep.",
        company: "Infosys",
      },
      {
        name: "Vikram Patel",
        role: "IT, Final Year",
        quote: "The selection probability engine showed me exactly which companies to target and what to fix. I stopped spraying applications and started converting.",
        company: "Accenture",
      },
      {
        name: "Sneha Reddy",
        role: "CSE, Final Year",
        quote: "Three rounds of adaptive mocks and my technical score went from 5 to 8. The Coach's Notebook panel showing what the AI knows about me was wild to see.",
        company: "Amazon",
      },
      {
        name: "Arjun Das",
        role: "Mech → IT switch",
        quote: "The Diagnostic Agent found transferable skills I hadn't even listed on my resume. It built my prep plan around them and I placed at Wipro.",
        company: "Wipro",
      },
    ],
  },
  solutions: {
    eyebrow: "Solutions",
    titleStart: "Agentic AI Coaching That",
    titleAccent: "Scales From One to Many",
    studentCard: {
      title: "Personal AI Coach",
      label: "01",
      description: "Your dedicated AI mentor with 3-layer memory — it knows your history, your struggles, and your next deadline.",
      features: [
        "6 Specialized AI Agents",
        "Adaptive Mock Rooms",
        "Resume Deep Dive + ATS Score",
        "2/4/8-Week Personalized Plans",
        "Proactive Nudges & Follow-ups",
        "Coach's Notebook (Visible Memory)",
      ],
      cta: "Start My Prep",
    },
    adminCard: {
      title: "TPC Admin Dashboard",
      label: "02",
      description: "Manage entire batches with AI-generated insights. Track readiness, flag at-risk students, and act before placement season ends.",
      features: [
        "Batch Readiness Overview",
        "At-Risk Student Alerts",
        "Skill-Market Gap Heatmap",
        "Selection Probability Engine",
        "AI-Generated Batch Insights",
        "Escalation Agent Integration",
        "Dedicated B2B Support",
      ],
      cta: "Open TPC Dashboard",
    },
  },
  faq: {
    eyebrow: "FAQ",
    titleStart: "Got Questions?",
    titleAccent: "We've Got Answers",
    description:
      "Everything students and coordinators usually ask before starting with PlaceAI.",
    defaultTab: "General",
    tabs: ["General", "Agents & Memory", "Interviews & Mock", "Technical", "Support"],
    items: {
      General: [
        {
          q: "What is PlaceAI?",
          a: "PlaceAI is an agentic AI career coach built for campus placements. It runs 6 specialized AI agents — Diagnostic, Planner, Accountability, Mock Interview, Escalation, and Memory — that collaborate through shared memory to give personalized, proactive, and persistent coaching.",
        },
        {
          q: "How is PlaceAI different from ChatGPT or VMock?",
          a: "Unlike ChatGPT, PlaceAI has persistent 3-layer memory across sessions, proactively reaches out with nudges and opportunity alerts, creates company-specific prep plans, and runs adaptive mock interviews. VMock only scores resumes. PlaceAI acts like a real mentor — it thinks, decides, and follows through.",
        },
        {
          q: "Who can use PlaceAI?",
          a: "Any university student preparing for campus placements, especially those targeting IT and software companies. TPC coordinators get a dedicated Admin Dashboard with batch-level insights, at-risk flags, and escalation alerts.",
        },
        {
          q: "Is PlaceAI suitable for non-CS students?",
          a: "Yes. The Diagnostic Agent identifies transferable skills from your background — many Mechanical and ECE students have successfully placed at IT companies using PlaceAI's profile mapping.",
        },
      ],
      "Agents & Memory": [
        {
          q: "How does the 3-layer memory system work?",
          a: "Layer 1 (Working Memory) holds the current conversation. Layer 2 (Episodic Memory) caches the last 5 conversation summaries in Redis for 7 days. Layer 3 (Semantic Memory) stores permanently extracted facts — your goals, skills, struggles, milestones, and behavioral preferences — as vector embeddings in pgvector, recalled by semantic similarity.",
        },
        {
          q: "What do the 6 agents actually do?",
          a: "Diagnostic Agent profiles you from resume + GitHub + micro-assessments. Planner Agent creates adaptive 2/4/8-week prep plans. Accountability Agent follows up on tasks and sends nudges. Mock Interview Agent runs company-specific adaptive simulations. Escalation Agent alerts your TPC coordinator when you're at risk. Memory Agent extracts and stores facts after every conversation.",
        },
        {
          q: "What is the Coach's Notebook?",
          a: "It's a visible memory panel showing exactly what the AI knows about you — your goals, verified skills, struggle areas, current strategy, key milestones, and upcoming deadlines. There's no black box here.",
        },
        {
          q: "How does the Escalation Agent work?",
          a: "It monitors for at-risk patterns: 3+ missed deadlines, declining mock scores over 2 weeks, burnout signals in conversation (shortened responses, negative language, long gaps), or complete inactivity. It first tries strategy switches. If those fail, it sends the TPC coordinator a full-context alert with recommended interventions.",
        },
      ],
      "Interviews & Mock": [
        {
          q: "How realistic are the mock interviews?",
          a: "Very realistic. The Mock Interview Agent is calibrated to each company's historical interview pattern — TCS, Wipro, Amazon, Infosys each have different round structures and difficulty levels. Questions adapt in real-time based on your answers, and every response is scored on a rubric with specific coaching feedback.",
        },
        {
          q: "What interview types are supported?",
          a: "Technical (DSA problems with adaptive difficulty), Behavioral (STAR-format with company-specific LP or team focus), HR (communication, salary expectations, company research), and System Design (for product and senior engineering roles).",
        },
        {
          q: "What is the Selection Probability Engine?",
          a: "For each student-company pair, PlaceAI computes a match score weighted across skill match (35%), CGPA fit (15%), project relevance (20%), historical profile similarity (20%), and competition level (10%). It shows actionable levers — e.g., 'Complete system design module: +8% match' — so you know exactly what to fix.",
        },
      ],
      Technical: [
        {
          q: "What AI models does PlaceAI use?",
          a: "PlaceAI uses Claude Sonnet 4 for all agent reasoning, coaching, and mock interview sessions. Claude Haiku 4.5 handles fast fact extraction and conversation summarization. OpenAI text-embedding-3-small generates vector embeddings for semantic memory and company RAG.",
        },
        {
          q: "How is my data stored and secured?",
          a: "All data is stored in Supabase PostgreSQL with Row Level Security (RLS) enforced at the database level. Your conversations, resume, and coaching history are encrypted and never accessible to other users. Embeddings are stored in pgvector with HNSW indexes for fast, private similarity search.",
        },
        {
          q: "What is the tech stack?",
          a: "Next.js 15 (App Router) + TypeScript for the full stack. Supabase for PostgreSQL, pgvector, Auth, Storage, and Realtime. Upstash Redis for caching, rate limiting, and the proactive job queue. Vercel AI SDK for streaming and tool calling. Deployed on Vercel.",
        },
      ],
      Support: [
        {
          q: "How do I get started?",
          a: "Sign up with your college email or Google account, upload your resume PDF, and set your target companies. The Diagnostic Agent immediately analyzes your profile and the Planner Agent creates your personalized prep plan — the whole onboarding takes under 5 minutes.",
        },
        {
          q: "Is PlaceAI free?",
          a: "PlaceAI offers a free tier with limited mock interviews and coaching sessions. Premium unlocks unlimited mocks, full memory history, the Coach's Notebook panel, and priority support. TPC institutions get dedicated pricing for batch access.",
        },
      ],
    },
  },
  cta: {
    eyebrow: "Get Started Today",
    titleStart: "Ready to Land Your",
    titleAccent: "Dream Placement?",
    description:
      "Join hundreds of students who trained with 6 AI agents — and walked into placement drives actually prepared.",
    button: "Start Practicing Free",
    benefits: ["No credit card required", "Free mock interviews included", "Cancel anytime"],
    brandWordmark: "PlaceAI",
  },
  footer: {
    brand: "PlaceAI",
    description: "6 agentic AI coaches. One shared memory. One mission — getting you placed.",
    productTitle: "Product",
    productLinks: [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Solutions", href: "#solutions" },
    ],
    resourcesTitle: "Resources",
    resourcesLinks: [
      { label: "FAQ", href: "#faq" },
      { label: "Success Stories", href: "#testimonials" },
      { label: "TPC Dashboard", href: "/admin" },
    ],
    connectTitle: "Connect",
    connectItems: ["Built for HackAI 2026", "Powered by Claude Sonnet 4", "Multi-agent · Memory-first"],
    copyright: "© 2026 PlaceAI. Built with AI, for students who dream big.",
    status: "All systems operational",
  },
} as const;

export type LandingPageText = typeof landingPageText;