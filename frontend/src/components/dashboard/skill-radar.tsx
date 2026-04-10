"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  PolarRadiusAxis,
} from "recharts";

interface SkillRadarProps {
  skills: Array<{ name: string; level: number; maxLevel?: number }>;
}

export function SkillRadar({ skills }: SkillRadarProps) {
  const data = skills.map((s) => ({
    subject: s.name,
    level: s.level,
    fullMark: s.maxLevel || 10,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
        No skill data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={data}>
        <PolarGrid stroke="#f3f4f6" strokeWidth={1.5} />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 500 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 10]}
          tick={{ fontSize: 9, fill: "#9ca3af" }}
        />
        <Radar
          name="Skills"
          dataKey="level"
          stroke="#7c5bf0"
          fill="#7c5bf0"
          fillOpacity={0.1}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
