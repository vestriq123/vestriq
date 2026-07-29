"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/common/DashboardShell";
import { PlanCard, type PlanCardData } from "@/components/common/PlanCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Package } from "lucide-react";

interface PlanData extends PlanCardData {
  enabled: boolean;
}

export default function InvestmentPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/investment-plans");
        const data = await res.json();
        if (data.success) setPlans(data.data);
      } catch (err) {
        console.error("Failed to load plans", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <DashboardShell active="plans" title="Investment Packages" subtitle="Select a wealth plan suited to your budget">
      <div className="max-w-4xl">
        <h2 className="text-2xl font-bold text-text-primary">Elevate Your Portfolio Value</h2>
        <p className="text-sm text-text-muted mt-2">
          Select one of our institutional-grade wealth planning portals. All investments are actively managed and adjusted by our management team to
          optimize yield and stability.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-text-muted text-sm">Analyzing wealth plans...</div>
      ) : plans.length === 0 ? (
        <EmptyState icon={<Package className="w-5 h-5" />} title="No investment plans available" description="Please contact support for assistance." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onSelect={() => router.push(`/dashboard/deposit?planId=${plan.id}`)} />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
