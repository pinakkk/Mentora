"use client";

import { motion } from "framer-motion";

interface ReadinessGaugeProps {
  score: number;
  label?: string;
}

export function ReadinessGauge({
  score,
  label = "Overall Readiness",
}: ReadinessGaugeProps) {
  const radius = 70;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 70) return "#7c5bf0";
    if (s >= 40) return "#f97316";
    return "#ef4444";
  };

  return (
    <div className="flex flex-col items-center pt-2">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={getColor(score)}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-semibold tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {score}%
          </motion.span>
          <span className="text-xs text-gray-400 mt-0.5">{label}</span>
        </div>
      </div>
    </div>
  );
}
