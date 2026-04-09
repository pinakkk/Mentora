"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Target, Zap, AlertTriangle, Star, Heart, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Skeleton } from "@/components/primitives/skeleton";
import type { MemoryFact } from "@/types/memory";

const categoryIcons: Record<string, typeof Brain> = {
  goal: Target,
  skill: Zap,
  struggle: AlertTriangle,
  milestone: Star,
  preference: Heart,
  behavioral: User,
};

const categoryColors: Record<string, string> = {
  goal: "bg-blue-100 text-blue-700",
  skill: "bg-emerald-100 text-emerald-700",
  struggle: "bg-orange-100 text-orange-700",
  milestone: "bg-purple-100 text-purple-700",
  preference: "bg-pink-100 text-pink-700",
  behavioral: "bg-gray-100 text-gray-700",
};

export default function MemoryPage() {
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/students/me/memory");
      if (res.ok) {
        const data = await res.json();
        setFacts(data.facts || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const categories = ["all", "goal", "skill", "struggle", "milestone", "preference", "behavioral"];
  const filtered = filter === "all" ? facts : facts.filter((f) => f.category === filter);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6" />
          Coach&apos;s Notebook
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Everything your AI coach knows about you. Transparent memory — no
          black boxes.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === cat
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
            {cat !== "all" && (
              <span className="ml-1 opacity-60">
                ({facts.filter((f) => f.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Facts */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No memories yet. Start chatting with your coach!</p>
            <p className="text-xs mt-1">
              Your coach will automatically remember important things about you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((fact, i) => {
            const Icon = categoryIcons[fact.category] || Brain;
            return (
              <motion.div
                key={fact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        categoryColors[fact.category] || "bg-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{fact.fact}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            categoryColors[fact.category] || ""
                          }`}
                        >
                          {fact.category}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {fact.importance}
                        </Badge>
                        <span className="text-[10px] text-gray-400">
                          {new Date(fact.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Memory Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {categories
              .filter((c) => c !== "all")
              .map((cat) => {
                const count = facts.filter((f) => f.category === cat).length;
                const Icon = categoryIcons[cat] || Brain;
                return (
                  <div key={cat} className="text-center">
                    <div
                      className={`h-10 w-10 rounded-lg mx-auto flex items-center justify-center ${
                        categoryColors[cat]
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-lg font-bold mt-2">{count}</p>
                    <p className="text-[10px] text-gray-400">{cat}</p>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
