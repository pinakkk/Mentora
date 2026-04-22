"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  MessageSquare,
  LayoutGrid,
  FileSearch,
  Mic,
  CalendarRange,
  Building2,
  BookOpen,
  LogOut,
  Menu,
  Bell,
} from "lucide-react";
import { Button } from "@/components/primitives/button";
import { Avatar, AvatarFallback } from "@/components/primitives/avatar";
import { Sheet, SheetContent } from "@/components/primitives/sheet";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";

const mainNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Resume", href: "/resume", icon: FileSearch },
  { name: "Mock Interview", href: "/mock", icon: Mic },
  { name: "Prep Plan", href: "/plan", icon: CalendarRange },
  { name: "Companies", href: "/companies", icon: Building2 },
  { name: "Coach's Notebook", href: "/memory", icon: BookOpen },
];

interface AppShellProps {
  user: User;
  children: React.ReactNode;
}

function SidebarContent({
  initials,
  pathname,
  user,
  onNavigate,
  onSignOut,
}: {
  initials: string;
  pathname: string;
  user: User;
  onNavigate: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex flex-col h-full py-7 px-4">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-2 px-3 mb-8"
      >
        <span className="text-lg font-semibold text-white tracking-tight">
          Mentora
        </span>
      </Link>

      <nav className="flex-1 flex flex-col gap-1">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider px-3 mb-2">
          Main Menu
        </span>
        {mainNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active
                  ? "bg-[#7c5bf0] text-white shadow-sm font-medium"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs bg-[#7c5bf0]/20 text-[#a78bfa] font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">
              {user.user_metadata?.full_name || "Student"}
            </p>
            <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-all w-full mt-3"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Log Out
        </button>
      </div>
    </div>
  );
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const initials = (user.user_metadata?.full_name || user.email || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currentPage =
    mainNav.find((n) => pathname === n.href)?.name || "Dashboard";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-900">
      <aside className="hidden lg:flex lg:w-[240px] lg:flex-col flex-shrink-0 sidebar-bg">
        <SidebarContent
          initials={initials}
          pathname={pathname}
          user={user}
          onNavigate={() => {}}
          onSignOut={handleSignOut}
        />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0 bg-zinc-900 border-zinc-800">
          <SidebarContent
            initials={initials}
            pathname={pathname}
            user={user}
            onNavigate={() => setMobileOpen(false)}
            onSignOut={handleSignOut}
          />
        </SheetContent>
      </Sheet>

      <main className="flex-1 bg-gray-50 rounded-tl-[2rem] flex flex-col overflow-hidden relative">
        <header className="h-16 flex-shrink-0 border-b border-gray-200/60 bg-white flex items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 rounded-xl border border-gray-200 hover:bg-gray-50"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-[18px] w-[18px] text-gray-600" />
            </Button>
            <h1 className="text-base lg:text-lg font-semibold tracking-tight text-gray-900">
              {currentPage}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="h-5 w-5" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="hidden sm:flex items-center gap-2.5 py-1.5 pl-3 pr-1.5 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors cursor-default">
              <span className="text-sm font-medium text-gray-700">
                {(user.user_metadata?.full_name || "Student").split(" ")[0]}
              </span>
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px] bg-violet-100 text-violet-600 font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
