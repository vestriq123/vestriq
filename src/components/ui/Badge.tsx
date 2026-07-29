import React from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant =
  | "pending"
  | "approved"
  | "active"
  | "rejected"
  | "cancelled"
  | "completed"
  | "success"
  | "danger"
  | "processing"
  | "info"
  | "neutral";

const variantMap: Record<BadgeVariant, string> = {
  pending: "bg-pending/10 text-pending",
  processing: "bg-info/10 text-info",
  approved: "bg-profit/10 text-profit",
  active: "bg-profit/10 text-profit",
  success: "bg-profit/10 text-profit",
  completed: "bg-brand-400/10 text-brand-300",
  rejected: "bg-danger/10 text-danger",
  cancelled: "bg-danger/10 text-danger",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  neutral: "bg-surface-3 text-text-secondary",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({ variant = "neutral", dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
        variantMap[variant],
        className
      )}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Maps common backend status strings directly to a sensible Badge variant. */
export function statusToVariant(status: string): BadgeVariant {
  const key = status.toUpperCase();
  const map: Record<string, BadgeVariant> = {
    PENDING: "pending",
    PROCESSING: "processing",
    APPROVED: "approved",
    ACTIVE: "active",
    COMPLETED: "completed",
    REJECTED: "rejected",
    CANCELLED: "cancelled",
    FAILED: "danger",
    SUCCESS: "success",
  };
  return map[key] || "neutral";
}

export default Badge;
