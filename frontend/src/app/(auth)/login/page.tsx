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
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 text-white flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="text-lg font-semibold">PlaceAI</span>
        </Link>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Your AI mentor
            <br />
            remembers everything.
          </h1>
          <p className="text-gray-400 max-w-md">
            6 specialized AI agents collaborate to diagnose your skills, create
            your plan, coach you through interviews, and follow up until you get
            placed.
          </p>
          <div className="space-y-3 pt-4">
            {[
              "Persistent memory across sessions",
              "Proactive nudges & accountability",
              "Company-specific mock interviews",
              "TPC admin dashboard",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-600">
          &copy; 2026 PlaceAI. Built for HackAI.
        </p>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="text-lg font-semibold">PlaceAI</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-gray-500 mt-1">
              {isSignUp
                ? "Start your placement journey"
                : "Continue your placement prep"}
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full rounded-full py-6"
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            <Globe className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400">
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
              className="rounded-full py-6 px-4"
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-full py-6 px-4"
              required
              minLength={6}
            />

            {error && (
              <p
                className={`text-sm ${
                  error.includes("Check your email")
                    ? "text-emerald-600"
                    : "text-red-500"
                }`}
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full rounded-full py-6 bg-gray-950 hover:bg-gray-800"
              disabled={loading}
            >
              {loading
                ? "Loading..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-gray-900 font-medium hover:underline"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
