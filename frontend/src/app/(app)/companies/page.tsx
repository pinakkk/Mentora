"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Calendar, Star, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Skeleton } from "@/components/primitives/skeleton";
import type { Company } from "@/types/company";

const tierColors: Record<string, string> = {
  dream: "bg-purple-100 text-purple-700",
  regular: "bg-blue-100 text-blue-700",
  mass: "bg-gray-100 text-gray-700",
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/companies");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Companies</h1>
        <p className="text-gray-500 text-sm mt-1">
          Companies visiting your campus. Match scores are calculated based on
          your skills.
        </p>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No companies added yet.</p>
            <p className="text-xs mt-1">
              Companies will appear here once your TPC adds them.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company, i) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-md transition">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{company.name}</h3>
                        <Badge
                          className={`text-[10px] mt-0.5 ${
                            tierColors[company.tier]
                          }`}
                        >
                          {company.tier}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {company.description && (
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {company.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {company.visitDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(company.visitDate).toLocaleDateString()}
                      </div>
                    )}
                    {company.roles && company.roles.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {(company.roles as string[]).length} roles
                      </div>
                    )}
                  </div>

                  {company.requirements && company.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                      {company.requirements.slice(0, 4).map((req, j) => (
                        <Badge
                          key={j}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {req.skill}
                        </Badge>
                      ))}
                      {company.requirements.length > 4 && (
                        <Badge variant="secondary" className="text-[10px]">
                          +{company.requirements.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
