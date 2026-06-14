"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Briefcase,
  Wallet,
  ArrowDownLeft,
  LogOut,
  User,
  ArrowRight,
  ShieldCheck,
  Percent
} from "lucide-react";

export default function InvestmentPlansPage() {
  const router = useRouter();
  interface PlanData {
    id: string;
    name: string;
    description: string;
    minAmount: number;
    maxAmount: number;
    enabled: boolean;
  }
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/investment-plans");
      const data = await res.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (err) {
      console.error("Failed to load plans", err);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.authenticated && data.user?.role === "ADMIN") {
        setIsAdmin(true);
      }
    } catch (err) {
      console.error("Failed to check admin status", err);
    }
  };

  useEffect(() => {
    fetchPlans();
    checkAdminStatus();
  }, []);

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (response.ok) {
        router.push("/login");
      }
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setLoadingLogout(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-slate-900/40 border-r border-slate-900 p-6 shrink-0">
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-indigo-400 w-6 h-6" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Vestriq
            </span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-900/50 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-colors text-left"
            >
              <Briefcase className="w-5 h-5" /> Portfolio Overview
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600/10 text-indigo-300 rounded-xl text-sm font-semibold border border-indigo-500/20 text-left">
              <ShieldCheck className="w-5 h-5" /> Investment Plans
            </button>
            <button
              onClick={() => router.push("/dashboard/deposit")}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-900/50 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-colors text-left"
            >
              <Wallet className="w-5 h-5" /> Deposit Funds
            </button>
            <button
              onClick={() => router.push("/dashboard/withdraw")}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-900/50 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-colors text-left"
            >
              <ArrowDownLeft className="w-5 h-5" /> Request Payout
            </button>
            {isAdmin && (
              <button
                onClick={() => router.push("/admin")}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-650/10 text-indigo-400 hover:text-indigo-300 rounded-xl text-sm font-semibold transition-colors text-left"
              >
                <ShieldCheck className="w-5 h-5" /> Admin Control
              </button>
            )}
          </div>
        </div>

        <div>
          <button
            onClick={handleLogout}
            disabled={loadingLogout}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl text-sm font-semibold transition-all"
          >
            <LogOut className="w-5 h-5" /> {loadingLogout ? "Logging out..." : "Log Out"}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* HEADER */}
        <header className="h-20 border-b border-slate-900 px-6 md:px-8 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-bold text-slate-200">Investment Packages</h1>
            <p className="text-xs text-slate-500 hidden sm:block">Select a wealth plan suited to your budget</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-slate-900">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Investor Profile</h4>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Active Member</p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTAINER */}
        <div className="flex-1 p-6 md:p-8 space-y-8">
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
              Elevate Your Portfolio Value
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Select one of our institutional-grade wealth planning portals. All investments are actively managed and adjusted by our management team to optimize yield and stability.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-400 text-sm">
              Analyzing wealth plans...
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-sm border border-slate-900 rounded-3xl bg-slate-900/10">
              No investment plans are currently available. Please contact support.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, i) => (
                <div
                  key={plan.id}
                  className="bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between relative group overflow-hidden transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Subtle Gradient Accent */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                  
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
                        Package {i + 1}
                      </span>
                      <Percent className="w-5 h-5 text-emerald-400" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-200 mb-2">{plan.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">{plan.description}</p>
                  </div>

                  <div>
                    <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 mb-6 space-y-2.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Minimum Limit</span>
                        <span className="font-bold text-white">${plan.minAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Maximum Limit</span>
                        <span className="font-bold text-white">${plan.maxAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/dashboard/deposit?planId=${plan.id}`)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10"
                    >
                      Invest In Plan <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
