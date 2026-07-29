"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TrendingUp, Users, Briefcase, ArrowDownLeft, ArrowUpRight, Wallet, Shield, Package, BarChart2, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type AdminTabId = "overview" | "users" | "investments" | "plans" | "deposits" | "withdrawals" | "wallets" | "analytics";

interface AdminShellProps {
  activeTab: AdminTabId;
  onTabChange: (tab: AdminTabId) => void;
  children: React.ReactNode;
}

const TAB_ITEMS: { id: AdminTabId; label: string; icon: React.ComponentType<{ className?: string }>; subtitle: string }[] = [
  { id: "overview", label: "Overview", icon: BarChart2, subtitle: "Platform-wide snapshot and pending approval queues" },
  { id: "users", label: "User Management", icon: Users, subtitle: "Verify identities and manage investor profiles" },
  { id: "investments", label: "Investments Engine", icon: Briefcase, subtitle: "Apply performance updates to active holdings" },
  { id: "plans", label: "Plan Management", icon: Package, subtitle: "Configure investment tiers, duration and growth rates" },
  { id: "deposits", label: "Deposits Funding", icon: ArrowDownLeft, subtitle: "Review and confirm incoming funding requests" },
  { id: "withdrawals", label: "Withdrawals Payouts", icon: ArrowUpRight, subtitle: "Process and disburse investor payout requests" },
  { id: "wallets", label: "Admin Wallets", icon: Wallet, subtitle: "Manage destination addresses for funding" },
  { id: "analytics", label: "System Analytics", icon: TrendingUp, subtitle: "Platform deposit, withdrawal and growth trends" },
];

export function AdminShell({ activeTab, onTabChange, children }: AdminShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setLoadingLogout(false);
    }
  };

  const current = TAB_ITEMS.find((t) => t.id === activeTab) ?? TAB_ITEMS[0];

  const navContent = (onNavigate?: () => void) => (
    <div className="space-y-1">
      {TAB_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === activeTab;
        return (
          <button
            key={item.id}
            onClick={() => {
              onNavigate?.();
              onTabChange(item.id);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-colors border",
              isActive ? "bg-brand-600/10 text-brand-300 border-brand-500/20" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary border-transparent"
            )}
          >
            <Icon className="w-5 h-5" /> {item.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-surface-1/60 border-r border-border-subtle p-6 shrink-0">
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="text-brand-400 w-6 h-6" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-400 to-accent bg-clip-text text-transparent">Vestriq Admin</span>
          </Link>
          {navContent()}
        </div>
        <button
          onClick={handleLogout}
          disabled={loadingLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors"
        >
          <LogOut className="w-5 h-5" /> {loadingLogout ? "Logging out..." : "Log Out"}
        </button>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        <header className="h-20 border-b border-border-subtle px-6 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 hover:bg-surface-2 rounded-xl text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-text-primary">{current.label}</h1>
              <p className="text-xs text-text-muted hidden sm:block">{current.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pl-4 border-l border-border-subtle">
            <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border-subtle flex items-center justify-center">
              <Shield className="w-5 h-5 text-brand-400" />
            </div>
            <div className="hidden sm:block">
              <h4 className="text-sm font-semibold text-text-primary">System Manager</h4>
              <span className="text-[10px] bg-brand-500/15 text-brand-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Administrator</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-8 space-y-8">{children}</div>
      </main>

      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 bg-surface-0/80 backdrop-blur-md lg:hidden flex">
          <div className="w-72 bg-surface-1 border-r border-border-strong p-6 flex flex-col justify-between h-full">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <TrendingUp className="text-brand-400 w-6 h-6" />
                  <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-400 to-accent bg-clip-text text-transparent">Vestriq Admin</span>
                </Link>
                <button onClick={() => setIsMobileNavOpen(false)} className="p-1.5 hover:bg-surface-2 rounded-lg text-text-secondary" aria-label="Close navigation">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {navContent(() => setIsMobileNavOpen(false))}
            </div>
            <button
              onClick={handleLogout}
              disabled={loadingLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors"
            >
              <LogOut className="w-5 h-5" /> {loadingLogout ? "Logging out..." : "Log Out"}
            </button>
          </div>
          <div className="flex-1" onClick={() => setIsMobileNavOpen(false)} />
        </div>
      )}
    </div>
  );
}

export default AdminShell;
