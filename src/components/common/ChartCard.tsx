import React from "react";
import { ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarChart3 } from "lucide-react";

/**
 * Shared Recharts theme + validated series colors (checked with the dataviz
 * skill's validate_palette.js against this app's --color-surface-2 dark
 * surface: #6366f1/#0d9488 pass every categorical check; single-series status
 * colors use the existing profit/loss semantic tokens per-app convention).
 */
export const chartTheme = {
  grid: "#1e2745",
  axis: "#5b6486",
  tooltipBg: "#182140",
  tooltipBorder: "#2b365c",
  textPrimary: "#f5f7fb",
  textSecondary: "#99a3c2",
  seriesBrand: "#6366f1",
  seriesDeposits: "#6366f1",
  seriesWithdrawals: "#0d9488",
  seriesProfit: "#34d399",
  seriesLoss: "#f87171",
};

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  label?: string | number;
  payload?: { name?: string; value?: number; color?: string }[];
  formatter?: (value: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="rounded-xl border px-3.5 py-2.5 text-xs shadow-elevated"
      style={{ background: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder }}
    >
      {label !== undefined && <p className="font-semibold mb-1.5" style={{ color: chartTheme.textPrimary }}>{label}</p>}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 justify-between">
            <span className="flex items-center gap-1.5" style={{ color: chartTheme.textSecondary }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums" style={{ color: chartTheme.textPrimary }}>
              {formatter && typeof entry.value === "number" ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  height?: number;
  isEmpty?: boolean;
  emptyLabel?: string;
  children: React.ReactElement;
}

export function ChartCard({ title, description, action, height = 300, isEmpty, emptyLabel = "Not enough data yet", children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardBody>
        {isEmpty ? (
          <EmptyState icon={<BarChart3 className="w-5 h-5" />} title={emptyLabel} />
        ) : (
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              {children}
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default ChartCard;
