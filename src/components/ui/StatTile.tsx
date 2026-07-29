import React from "react";
import { cn } from "@/lib/cn";

type Tone = "brand" | "profit" | "loss" | "pending" | "neutral";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand-500/10 text-brand-300",
  profit: "bg-profit/10 text-profit",
  loss: "bg-loss/10 text-loss",
  pending: "bg-pending/10 text-pending",
  neutral: "bg-surface-3 text-text-secondary",
};

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  delta?: string;
  deltaPositive?: boolean;
  subtext?: string;
  className?: string;
}

export function StatTile({ label, value, icon, tone = "brand", delta, deltaPositive, subtext, className }: StatTileProps) {
  return (
    <div className={cn("bg-surface-2/60 border border-border-subtle rounded-card p-5", className)}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</span>
        {icon && <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", toneClasses[tone])}>{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-text-primary tracking-tight tabular-nums">{value}</div>
      {(delta || subtext) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {delta && <span className={cn("font-semibold", deltaPositive ? "text-profit" : "text-loss")}>{delta}</span>}
          {subtext && <span className="text-text-muted">{subtext}</span>}
        </div>
      )}
    </div>
  );
}

export default StatTile;
