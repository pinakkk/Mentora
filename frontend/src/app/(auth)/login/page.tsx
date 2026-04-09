"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { ArrowRight, Globe } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setError("Check your email for a confirmation link!");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
      }
    }
    setLoading(false);
  }

  async function handleGoogleAuth() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex overflow-hidden bg-[#f4f0fb] text-slate-950"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(124,91,240,0.16), transparent 28%), radial-gradient(circle at 85% 20%, rgba(255,255,255,0.92), transparent 22%), linear-gradient(180deg, #ede8f5 0%, #f4f0fb 46%, #f7f4fc 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-7rem] h-64 w-64 rounded-full bg-[#cbbdfc] blur-3xl opacity-70" />
        <div className="absolute bottom-[-8rem] right-[-5rem] h-72 w-72 rounded-full bg-[#d9f7ea] blur-3xl opacity-60" />
        <div className="absolute inset-y-0 left-1/2 hidden w-px bg-white/40 lg:block" />
      </div>

      {/* Left Panel */}
      <div
        className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden border-r border-white/20 p-12 text-white"
        style={{
          background:
            "linear-gradient(160deg, #181320 0%, #11131a 54%, #0f1720 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(124,91,240,0.34),transparent_28%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_72%,rgba(95,211,166,0.18),transparent_24%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_38%,transparent_62%,rgba(255,255,255,0.03))]" />
        </div>

        <Link href="/" className="relative z-10 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/8 backdrop-blur-md">
            <div className="h-2.5 w-2.5 rounded-full bg-[#8d73f6]" />
          </div>
          <span className="text-lg font-semibold tracking-[0.02em]">PlaceAI</span>
        </Link>

        <div className="relative z-10 space-y-7">
          <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-[-0.03em] xl:text-5xl">
            Your AI mentor
            <br />
            remembers everything.
          </h1>
          <p className="max-w-md text-[15px] leading-7 text-white/68">
            6 specialized AI agents collaborate to diagnose your skills, create
            your plan, coach you through interviews, and follow up until you get
            placed.
          </p>
          <div className="space-y-3 pt-5">
            {[
              "Persistent memory across sessions",
              "Proactive nudges & accountability",
              "Company-specific mock interviews",
              "TPC admin dashboard",
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-3 text-sm backdrop-blur-sm"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-[#8d73f6]" />
                <span className="text-white/78">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs tracking-[0.16em] text-white/35 uppercase">
          &copy; 2026 PlaceAI. Built for HackAI.
        </p>
      </div>

      {/* Right Panel — Form */}
      <div className="relative flex flex-1 items-center justify-center p-8 sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(124,91,240,0.10),transparent_24%)]" />

        <div className="relative z-10 w-full max-w-md space-y-8">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#cfc5f4] bg-white/70 shadow-[0_10px_35px_rgba(124,91,240,0.12)] backdrop-blur-md">
              <div className="h-2.5 w-2.5 rounded-full bg-[#7c5bf0]" />
            </div>
            <span className="text-lg font-semibold tracking-[0.02em]">PlaceAI</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-[-0.04em] text-slate-950">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-1 text-[15px] text-slate-600">
              {isSignUp
                ? "Start your placement journey"
                : "Continue your placement prep"}
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full rounded-full border-[#d9d1f4] bg-white/78 py-6 text-slate-700 shadow-[0_18px_45px_rgba(124,91,240,0.10)] backdrop-blur-xl transition-all duration-300 hover:border-[#c4b6f7] hover:bg-white hover:text-slate-900 hover:shadow-[0_24px_55px_rgba(124,91,240,0.16)]"
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            <Globe className="mr-2 h-5 w-5 text-[#7c5bf0]" />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#ddd5f5]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#f4f0fb] px-3 tracking-[0.22em] text-slate-400">
                or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-full border-[#d9d1f4] bg-white/72 px-4 py-6 shadow-[0_12px_30px_rgba(124,91,240,0.08)] backdrop-blur-md placeholder:text-slate-400 focus-visible:border-[#b7a4fa] focus-visible:ring-[#c7b8fb]/60"
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-full border-[#d9d1f4] bg-white/72 px-4 py-6 shadow-[0_12px_30px_rgba(124,91,240,0.08)] backdrop-blur-md placeholder:text-slate-400 focus-visible:border-[#b7a4fa] focus-visible:ring-[#c7b8fb]/60"
              required
              minLength={6}
            />

            {error && (
              <p
                className={`text-sm ${
                  error.includes("Check your email")
                    ? "text-emerald-700"
                    : "text-rose-500"
                }`}
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full rounded-full border border-transparent bg-[#17131f] py-6 text-white shadow-[0_22px_55px_rgba(23,19,31,0.24)] transition-all duration-300 hover:bg-[#231b33] hover:shadow-[0_28px_70px_rgba(124,91,240,0.24)]"
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
              <ArrowRight className="ml-2 h-4 w-4 text-[#b7a4fa]" />
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="font-medium text-[#4f36b6] underline-offset-4 transition-colors hover:text-[#3c2890] hover:underline"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
