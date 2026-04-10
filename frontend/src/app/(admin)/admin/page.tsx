"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Brain,
  GraduationCap,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Skeleton } from "@/components/primitives/skeleton";
import type { TPCAlert } from "@/types/agents";

interface BatchStats {
  totalStudents: number;
  avgReadiness: number;
  atRiskCount: number;
  placedCount: number;
  onboardedCount: number;
  recentSignups: number;
  atRiskStudents: Array<{
    id: string;
    name: string;
    readiness: number;
    department: string | null;
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    readiness: number;
    department: string | null;
  }>;
}

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-700",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<BatchStats | null>(null);
  const [alerts, setAlerts] = useState<TPCAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, alertsRes] = await Promise.all([
          fetch("/api/admin/dashboard"),
          fetch("/api/admin/alerts"),
        ]);

        if (!statsRes.ok) {
          setError(`Dashboard fetch failed: ${statsRes.status}`);
        } else {
          setStats(await statsRes.json());
        }

        if (alertsRes.ok) {
          const data = await alertsRes.json();
          setAlerts(data.alerts || []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">
                Couldn&apos;t load admin dashboard
              </p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Students",
      value: stats?.totalStudents || 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Onboarded",
      value: stats?.onboardedCount || 0,
      icon: GraduationCap,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Avg Readiness",
      value: `${stats?.avgReadiness || 0}%`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "At Risk",
      value: stats?.atRiskCount || 0,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Placed",
      value: stats?.placedCount || 0,
      icon: BarChart3,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "New (7 days)",
      value: stats?.recentSignups || 0,
      icon: Activity,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Batch Overview
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Real-time view of your placement cohort, risk signals, and AI insights.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}
                  >
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                    <p className="text-[11px] text-slate-500 truncate">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Two columns: At Risk + Top Performers */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              At Risk Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.atRiskStudents.length > 0 ? (
              <div className="space-y-2">
                {stats.atRiskStudents.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {s.department || "Dept N/A"}
                      </p>
                    </div>
                    <Badge className="bg-red-100 text-red-700 text-[10px] tabular-nums">
                      {s.readiness}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 text-sm py-8">
                No at-risk students. Everyone is above 30% readiness.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.topPerformers.length > 0 ? (
              <div className="space-y-2">
                {stats.topPerformers.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {s.department || "Dept N/A"}
                      </p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] tabular-nums">
                      {s.readiness}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 text-sm py-8">
                Not enough data yet — students still onboarding.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Escalation alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Escalation Alerts
          </CardTitle>
          <Badge variant="secondary">
            {alerts.filter((a) => a.status === "new_alert").length} new
          </Badge>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">
              No alerts. The accountability cron will flag at-risk students automatically.
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 transition"
                >
                  <Badge
                    className={`text-[10px] shrink-0 ${
                      severityColors[alert.severity]
                    }`}
                  >
                    {alert.severity}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {alert.studentName || "Student"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{alert.pattern}</p>
                    {alert.recommendation && (
                      <p className="text-xs text-blue-600 mt-1">
                        Recommendation: {alert.recommendation}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            AI Batch Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-slate-400 text-sm">
          AI insights will be generated after enough student data is collected.
        </CardContent>
      </Card>
    </div>
  );
}
