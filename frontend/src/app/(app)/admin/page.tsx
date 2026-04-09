"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Brain,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Skeleton } from "@/components/primitives/skeleton";
import { Button } from "@/components/primitives/button";
import type { TPCAlert } from "@/types/agents";

interface BatchStats {
  totalStudents: number;
  avgReadiness: number;
  atRiskCount: number;
  placedCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<BatchStats | null>(null);
  const [alerts, setAlerts] = useState<TPCAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [statsRes, alertsRes] = await Promise.all([
        fetch("/api/admin/dashboard"),
        fetch("/api/admin/alerts"),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
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

  const statCards = [
    {
      label: "Total Students",
      value: stats?.totalStudents || 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
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
  ];

  const severityColors: Record<string, string> = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">TPC Dashboard</h1>
          <p className="text-gray-500 text-sm">
            Batch overview, at-risk students, and AI insights
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}
                  >
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-gray-400">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
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
            <p className="text-center text-gray-400 text-sm py-8">
              No alerts. All students are on track!
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition"
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
                    <p className="text-xs text-gray-500 mt-0.5">
                      {alert.pattern}
                    </p>
                    {alert.recommendation && (
                      <p className="text-xs text-blue-600 mt-1">
                        Recommendation: {alert.recommendation}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            AI Batch Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-400 text-sm">
          AI insights will be generated after enough student data is collected.
        </CardContent>
      </Card>
    </div>
  );
}
