import React from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: "pill" | "underline" | "sidebar";
  className?: string;
}

export function Tabs({ items, activeId, onChange, variant = "pill", className }: TabsProps) {
  if (variant === "sidebar") {
    return (
      <div className={cn("flex flex-col gap-1", className)} role="tablist">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.id)}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                active ? "bg-brand-500/10 text-brand-300" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              )}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {typeof item.count === "number" && item.count > 0 && (
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", active ? "bg-brand-500/20 text-brand-300" : "bg-surface-3 text-text-muted")}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "underline") {
    return (
      <div className={cn("flex items-center gap-6 border-b border-border-subtle", className)} role="tablist">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.id)}
              className={cn(
                "relative pb-3 text-sm font-semibold transition-colors",
                active ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
              )}
            >
              {item.label}
              {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap bg-surface-1 border border-border-subtle rounded-xl p-1.5", className)} role="tablist">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors",
              active ? "bg-brand-600 text-white" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
