import React from "react";
import { ArrowDownLeft, ArrowUpRight, Gift, SlidersHorizontal, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";

export interface TransactionInfo {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

const typeMeta: Record<string, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  DEPOSIT: { icon: ArrowDownLeft, tone: "text-profit bg-profit/10" },
  WITHDRAWAL: { icon: ArrowUpRight, tone: "text-loss bg-loss/10" },
  BONUS: { icon: Gift, tone: "text-brand-300 bg-brand-500/10" },
  ADJUSTMENT: { icon: SlidersHorizontal, tone: "text-pending bg-pending/10" },
  INVESTMENT_FUND: { icon: TrendingUp, tone: "text-brand-300 bg-brand-500/10" },
};

export function TransactionRow({ tx }: { tx: TransactionInfo }) {
  const meta = typeMeta[tx.type] || typeMeta.ADJUSTMENT;
  const Icon = meta.icon;
  const isPositive = tx.amount >= 0;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", meta.tone)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-text-primary truncate">{tx.description}</p>
        <p className="text-[10px] text-text-muted">{new Date(tx.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
      </div>
      <span className={cn("text-xs font-bold tabular-nums shrink-0", isPositive ? "text-profit" : "text-loss")}>
        {isPositive ? "+" : "-"}${Math.abs(tx.amount).toLocaleString()}
      </span>
    </div>
  );
}

export default TransactionRow;
