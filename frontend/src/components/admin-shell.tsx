"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/primitives/button";
import { Avatar, AvatarFallback } from "@/components/primitives/avatar";
import type { User } from "@supabase/supabase-js";

interface AdminShellProps {
  user: User;
  adminName: string;
  children: React.ReactNode;
}

/**
 * Visually distinct shell for the TPC admin section.
 * - Top bar in dark slate so admins know they're in a privileged area
 * - Single-page app for now; nav bar can grow as we add admin pages
 * - "Back to student view" link in case the admin is also testing as themselves
 */
export function AdminShell({ user, adminName, children }: AdminShellProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const initials = (adminName || user.email || "TPC")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-violet-300" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">PlaceAI · TPC</p>
            <p className="text-[11px] text-slate-400">Training & Placement Cell Console</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white hover:bg-white/10 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Student view
            </Button>
          </Link>
          <div className="flex items-center gap-2 pl-3 border-l border-slate-700">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-[11px] bg-violet-500/20 text-violet-200 font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-white leading-tight">{adminName}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-slate-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
