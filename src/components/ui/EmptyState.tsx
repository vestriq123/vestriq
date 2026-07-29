import React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-14 px-6", className)}>
      <div className="w-12 h-12 rounded-2xl bg-surface-3 flex items-center justify-center text-text-muted mb-4">
        {icon || <Inbox className="w-5 h-5" />}
      </div>
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      {description && <p className="text-xs text-text-muted mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;
