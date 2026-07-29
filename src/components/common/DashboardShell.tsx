"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Briefcase, ShieldCheck, Wallet, ArrowDownLeft, LogOut, Bell, User, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type DashboardNavId = "overview" | "plans" | "deposit" | "withdraw";

interface NotificationInfo {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface DashboardShellProps {
  active: DashboardNavId;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: DashboardNavId; label: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Portfolio Overview", href: "/dashboard", icon: Briefcase },
  { id: "plans", label: "Investment Plans", href: "/dashboard/plans", icon: ShieldCheck },
  { id: "deposit", label: "Deposit Funds", href: "/dashboard/deposit", icon: Wallet },
  { id: "withdraw", label: "Request Payout", href: "/dashboard/withdraw", icon: ArrowDownLeft },
];

export function DashboardShell({ active, title, subtitle, children }: DashboardShellProps) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [notifications, setNotifications] = useState<NotificationInfo[]>([]);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [sessionRes, notifRes] = await Promise.all([fetch("/api/auth/session"), fetch("/api/notifications")]);
        const sessionJson = await sessionRes.json();
        if (sessionJson.authenticated) {
          setIsAdmin(sessionJson.user?.role === "ADMIN");
          setDisplayName(sessionJson.user?.username || "");
        }
        const notifJson = await notifRes.json();
        if (notifJson.success) setNotifications(notifJson.data);
      } catch (err) {
        console.error("Failed to load shell data", err);
      }
    })();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navContent = (onNavigate?: () => void) => (
    <div className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            onClick={() => {
              onNavigate?.();
              router.push(item.href);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-colors border",
              isActive
                ? "bg-brand-600/10 text-brand-300 border-brand-500/20"
                : "text-text-secondary hover:bg-surface-2 hover:text-text-primary border-transparent"
            )}
          >
            <Icon className="w-5 h-5" /> {item.label}
          </button>
        );
      })}
      {isAdmin && (
        <button
          onClick={() => {
            onNavigate?.();
            router.push("/admin");
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left text-brand-400 hover:bg-brand-500/10 hover:text-brand-300 transition-colors border border-transparent"
        >
          <ShieldCheck className="w-5 h-5" /> Admin Control
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-surface-1/60 border-r border-border-subtle p-6 shrink-0">
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="text-brand-400 w-6 h-6" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-400 to-accent bg-clip-text text-transparent">Vestriq</span>
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

      {/* Main content */}
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
              <h1 className="text-lg font-bold text-text-primary">{title}</h1>
              {subtitle && <p className="text-xs text-text-muted hidden sm:block">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <button onClick={() => setIsNotifOpen((v) => !v)} className="relative p-2 hover:bg-surface-2 rounded-xl transition-colors" aria-label="Notifications">
                <Bell className="w-5 h-5 text-text-secondary" />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-surface-0" />}
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-surface-2 border border-border-strong rounded-2xl shadow-elevated p-4 z-50 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
                    <h4 className="text-xs font-bold text-text-primary">Notifications</h4>
                    <span className="text-[10px] text-brand-400 font-semibold">{unreadCount} Unread</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-[11px] text-text-muted text-center py-6">No notifications yet</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "p-2.5 rounded-xl border text-[11px] text-left",
                            !n.read ? "border-brand-500/20 bg-brand-500/5" : "border-border-subtle bg-surface-1/40"
                          )}
                        >
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <span className="font-bold text-text-primary">{n.title}</span>
                            {!n.read && (
                              <button
                                onClick={() => handleMarkAsRead(n.id)}
                                className="text-[9px] text-brand-400 hover:text-brand-300 font-bold uppercase tracking-wider transition-colors shrink-0"
                              >
                                Dismiss
                              </button>
                            )}
                          </div>
                          <p className="text-text-secondary leading-relaxed">{n.message}</p>
                          <span className="text-[9px] text-text-muted mt-1 block">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-border-subtle">
              <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border-subtle flex items-center justify-center">
                <User className="w-5 h-5 text-text-secondary" />
              </div>
              <div className="hidden sm:block">
                <h4 className="text-sm font-semibold text-text-primary">{displayName || "Investor"}</h4>
                <p className="text-[10px] text-text-muted uppercase font-semibold">Investor Profile</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-8 space-y-8">{children}</div>
      </main>

      {/* Mobile drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 bg-surface-0/80 backdrop-blur-md lg:hidden flex">
          <div className="w-72 bg-surface-1 border-r border-border-strong p-6 flex flex-col justify-between h-full">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <TrendingUp className="text-brand-400 w-6 h-6" />
                  <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-400 to-accent bg-clip-text text-transparent">Vestriq</span>
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

export default DashboardShell;
