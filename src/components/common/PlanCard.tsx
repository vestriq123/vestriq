import React from "react";
import { TrendingUp, Clock } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export interface PlanCardData {
  id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  dailyGrowthRate?: number;
  durationMonths?: number;
  enabled?: boolean;
}

interface PlanCardProps {
  plan: PlanCardData;
  onSelect?: (plan: PlanCardData) => void;
  selected?: boolean;
  actionLabel?: string;
}

export function PlanCard({ plan, onSelect, selected, actionLabel = "Invest In Plan" }: PlanCardProps) {
  return (
    <Card hover className={cn("flex flex-col", selected && "border-brand-500/60 ring-1 ring-brand-500/30")}>
      <CardBody className="flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-bold text-text-primary">{plan.name}</h3>
          {plan.enabled === false && <Badge variant="rejected">Inactive</Badge>}
        </div>
        <p className="text-xs text-text-muted mb-5 flex-1 leading-relaxed">{plan.description}</p>

        <div className="bg-surface-1 rounded-xl p-4 border border-border-subtle space-y-2.5 mb-5">
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Investment Range</span>
            <span className="font-semibold text-text-primary tabular-nums">
              ${plan.minAmount.toLocaleString()} &ndash; ${plan.maxAmount.toLocaleString()}
            </span>
          </div>
          {typeof plan.dailyGrowthRate === "number" && (
            <div className="flex justify-between text-xs">
              <span className="text-text-muted flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Daily Growth
              </span>
              <span className="font-semibold text-profit tabular-nums">{(plan.dailyGrowthRate * 100).toFixed(2)}%/day</span>
            </div>
          )}
          {typeof plan.durationMonths === "number" && (
            <div className="flex justify-between text-xs">
              <span className="text-text-muted flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Lock-up Duration
              </span>
              <span className="font-semibold text-text-primary tabular-nums">{plan.durationMonths} months</span>
            </div>
          )}
        </div>

        {onSelect && (
          <Button onClick={() => onSelect(plan)} fullWidth variant={selected ? "primary" : "secondary"}>
            {selected ? "Selected" : actionLabel}
          </Button>
        )}
      </CardBody>
    </Card>
  );
}

export default PlanCard;
