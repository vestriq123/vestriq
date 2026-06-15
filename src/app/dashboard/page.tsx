"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Briefcase,
  Wallet,
  LogOut,
  Bell,
  Clock,
  TrendingDown,
  User,
  ShieldCheck,
  Menu,
  X
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

export default function UserDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"analytics" | "transactions" | "logs">("analytics");
  const [loadingLogout, setLoadingLogout] = useState(false);

  // Live Data Interfaces
  interface DepositInfo {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    plan?: { name: string };
  }

  interface InvestmentInfo {
    id: string;
    amount: number;
    balance: number;
    status: string;
    createdAt: string;
    performanceRecords?: {
      id: string;
      amount: number;
      type: string;
      note?: string | null;
      createdAt: string;
    }[];
  }

  interface TransactionInfo {
    id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
  }

  interface NotificationInfo {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
  }

  interface WithdrawalInfo {
    id: string;
    amount: number;
    address: string;
    status: string;
    createdAt: string;
  }

  interface ProfileInfo {
    customPortfolioValue: number | null;
    customTotalInvestment: number | null;
    customTotalProfit: number | null;
    customWithdrawal: number | null;
    customAvailableCash: number | null;
  }

  // Live Data States
  const [deposits, setDeposits] = useState<DepositInfo[]>([]);
  const [investments, setInvestments] = useState<InvestmentInfo[]>([]);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [notifications, setNotifications] = useState<NotificationInfo[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalInfo[]>([]);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  const fetchAllData = async () => {
    try {
      const [depRes, invRes, txRes, notifRes, withdrawalRes, profileRes, sessionRes] = await Promise.all([
        fetch("/api/deposits"),
        fetch("/api/investments"),
        fetch("/api/transactions"),
        fetch("/api/notifications"),
        fetch("/api/withdrawals"),
        fetch("/api/profile"),
        fetch("/api/auth/session")
      ]);

      const depJson = await depRes.json();
      const invJson = await invRes.json();
      const txJson = await txRes.json();
      const notifJson = await notifRes.json();
      const withdrawalJson = await withdrawalRes.json();
      const profileJson = await profileRes.json();
      const sessionJson = await sessionRes.json();

      if (depJson.success) setDeposits(depJson.data);
      if (invJson.success) setInvestments(invJson.data);
      if (txJson.success) setTransactions(txJson.data);
      if (notifJson.success) setNotifications(notifJson.data);
      if (withdrawalJson.success) setWithdrawals(withdrawalJson.data);
      if (profileJson.success) setProfile(profileJson.data);
      if (sessionJson.authenticated && sessionJson.user?.role === "ADMIN") {
        setIsAdmin(true);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAllData();
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

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      if (res.ok) {
        const notifRes = await fetch("/api/notifications");
        const notifJson = await notifRes.json();
        if (notifJson.success) {
          setNotifications(notifJson.data);
        }
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const calculatedPortfolioValue = investments.reduce((acc, inv) => acc + inv.balance, 0);
  const calculatedTotalInvested = investments.reduce((acc, inv) => acc + inv.amount, 0);
  const calculatedWithdrawalTotal = withdrawals
    .filter(withdrawal => withdrawal.status === "APPROVED")
    .reduce((total, withdrawal) => total + withdrawal.amount, 0);

  const portfolioValue = profile?.customPortfolioValue !== null && profile?.customPortfolioValue !== undefined
    ? profile.customPortfolioValue
    : calculatedPortfolioValue;

  const totalInvested = profile?.customTotalInvestment !== null && profile?.customTotalInvestment !== undefined
    ? profile.customTotalInvestment
    : calculatedTotalInvested;

  const totalProfit = profile?.customTotalProfit !== null && profile?.customTotalProfit !== undefined
    ? profile.customTotalProfit
    : (portfolioValue - totalInvested);

  const approvedWithdrawalTotal = profile?.customWithdrawal !== null && profile?.customWithdrawal !== undefined
    ? profile.customWithdrawal
    : calculatedWithdrawalTotal;

  const availableCash = profile?.customAvailableCash !== null && profile?.customAvailableCash !== undefined
    ? profile.customAvailableCash
    : 0.00;

  const activePlanCount = investments.filter(inv => inv.status === "ACTIVE").length;
  const performanceRecords = investments
    .flatMap((investment) => investment.performanceRecords || [])
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const growthData = performanceRecords.reduce<{ name: string; value: number }[]>((records, record) => {
    const previousValue = records.length ? records[records.length - 1].value : totalInvested;
    records.push({
      name: new Date(record.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: previousValue + record.amount,
    });
    return records;
  }, []);
  const portfolioGrowthData = growthData.length ? growthData : [{ name: "Current", value: portfolioValue }];
  const profitHistoryMap = performanceRecords.reduce<Record<string, number>>((acc, record) => {
    if (record.amount <= 0) return acc;
    const month = new Date(record.createdAt).toLocaleDateString(undefined, { month: "short" });
    acc[month] = (acc[month] || 0) + record.amount;
    return acc;
  }, {});
  const profitHistory = Object.entries(profitHistoryMap).map(([name, profit]) => ({ name, profit }));
  const portfolioProfitHistory = profitHistory.length ? profitHistory : [{ name: "Current", profit: Math.max(totalProfit, 0) }];

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
              id="nav-overview"
              onClick={() => router.push("/dashboard")}
              className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600/10 text-indigo-300 rounded-xl text-sm font-semibold border border-indigo-500/20 text-left"
            >
              <Briefcase className="w-5 h-5" /> Portfolio Overview
            </button>
            <button
              id="nav-plans"
              onClick={() => router.push("/dashboard/plans")}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-900/50 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-colors text-left"
            >
              <ShieldCheck className="w-5 h-5" /> Investment Plans
            </button>
            <button
              id="nav-deposit"
              onClick={() => router.push("/dashboard/deposit")}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-900/50 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-colors text-left"
            >
              <Wallet className="w-5 h-5" /> Deposit Funds
            </button>
            <button
              id="nav-withdraw"
              type="button"
              onClick={() => router.push("/dashboard/withdraw")}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-900/50 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-colors text-left"
            >
              <ArrowDownLeft className="w-5 h-5" /> Request Payout
            </button>
            {isAdmin && (
              <button
                id="nav-admin"
                type="button"
                onClick={() => router.push("/admin")}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-650/10 text-indigo-400 hover:text-indigo-300 rounded-xl text-sm font-semibold border border-transparent transition-colors text-left"
              >
                <ShieldCheck className="w-5 h-5 text-indigo-400" /> Admin Control
              </button>
            )}
          </div>
        </div>

        <div>
          <button
            id="nav-logout"
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-200">Portfolio Portal</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Real-time assets allocation logs</p>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className="relative cursor-pointer hover:bg-slate-900 p-2 rounded-xl transition-colors"
              >
                <Bell className="w-5 h-5 text-slate-400 hover:text-white" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-slate-950" />
                )}
              </button>

              {isNotifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300">Notifications</h4>
                    <span className="text-[10px] text-indigo-400 font-semibold">{notifications.filter(n => !n.read).length} Unread</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-[10px] text-slate-500 text-center py-4">No notifications yet</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`p-2.5 rounded-xl border text-[10px] text-left ${!n.read ? "border-indigo-500/20 bg-indigo-500/5" : "border-slate-800 bg-slate-950/20"}`}>
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <span className="font-bold text-slate-200">{n.title}</span>
                            {!n.read && (
                              <button
                                type="button"
                                onClick={() => handleMarkAsRead(n.id)}
                                className="text-[9px] text-indigo-450 hover:text-indigo-400 font-bold uppercase tracking-wider transition-colors shrink-0"
                              >
                                Dismiss
                              </button>
                            )}
                          </div>
                          <p className="text-slate-400 leading-relaxed">{n.message}</p>
                          <span className="text-[9px] text-slate-500 mt-1 block">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-900">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div className="hidden sm:block">
                <h4 className="text-sm font-semibold">Premium Investor</h4>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Investor Profile</p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTAINER */}
        <div className="flex-1 p-6 md:p-8 space-y-8">
          {loadingData ? (
            <div className="space-y-8 animate-pulse">
              {/* SKELETON OVERVIEW CARDS */}
              <div className="grid grid-cols-2 gap-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-slate-900/20 border border-slate-900/50 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-3 w-16 bg-slate-850 rounded" />
                      <div className="h-4 w-4 bg-slate-850 rounded-full" />
                    </div>
                    <div className="h-6 w-24 bg-slate-850 rounded" />
                    <div className="h-3 w-20 bg-slate-855 rounded" />
                  </div>
                ))}
              </div>
              {/* SKELETON CHART & SIDEBAR */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-slate-900/20 border border-slate-900/50 rounded-3xl p-6 h-[400px] flex flex-col justify-between">
                  <div className="h-6 w-48 bg-slate-850 rounded" />
                  <div className="h-[280px] bg-slate-850/40 rounded-2xl" />
                </div>
                <div className="space-y-8">
                  <div className="bg-slate-900/20 border border-slate-900/50 rounded-3xl p-6 h-56 space-y-4">
                    <div className="h-4 w-32 bg-slate-850 rounded" />
                    <div className="h-12 bg-slate-850/40 rounded-xl" />
                    <div className="h-12 bg-slate-850/40 rounded-xl" />
                  </div>
                  <div className="bg-slate-900/20 border border-slate-900/50 rounded-3xl p-6 h-48 space-y-4">
                    <div className="h-4 w-32 bg-slate-855 rounded" />
                    <div className="h-10 bg-slate-850/40 rounded-xl" />
                    <div className="h-10 bg-slate-850/40 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* OVERVIEW CARDS */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Portfolio Value</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold">${portfolioValue.toLocaleString()}</h3>
              <p className="text-[10px] text-emerald-400 mt-2 font-semibold">+${totalProfit.toLocaleString()} Valuation</p>
            </div>

            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Invested</span>
                <DollarSign className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold">${totalInvested.toLocaleString()}</h3>
              <p className="text-[10px] text-slate-500 mt-2 font-semibold">Across {activePlanCount} Active {activePlanCount === 1 ? "Plan" : "Plans"}</p>
            </div>

            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Profit</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold">${totalProfit.toLocaleString()}</h3>
              <p className="text-[10px] text-emerald-400 mt-2 font-semibold">+{totalInvested > 0 ? Math.round((totalProfit / totalInvested) * 100) : 0}% Total Increment</p>
            </div>

            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Withdrawals</span>
                <ArrowUpRight className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="text-xl font-bold">${approvedWithdrawalTotal.toLocaleString()}</h3>
              <p className="text-[10px] text-red-400 mt-2 font-semibold">Processed Successfully</p>
            </div>

            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Available Cash</span>
                <Wallet className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold">${availableCash.toLocaleString()}</h3>
              <p className="text-[10px] text-slate-500 mt-2 font-semibold">Wallet Funding Balance</p>
            </div>
          </div>

          {/* MAIN GRAPH / GRAPH WORKSPACE */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* TABS SELECTOR & CHART CONTENT */}
            <div className="xl:col-span-2 bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[400px]">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-900/60">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab("analytics")}
                    className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${activeTab === "analytics" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    Performance Charts
                  </button>
                  <button
                    onClick={() => setActiveTab("transactions")}
                    className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${activeTab === "transactions" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    Tables Logs
                  </button>
                </div>
              </div>

              <div className="flex-1">
                {activeTab === "analytics" && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300">Portfolio Growth</h4>
                      <div className="h-64 mt-4 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={portfolioGrowthData}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                            <YAxis stroke="#64748b" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} />
                            <Area type="monotone" dataKey="value" stroke="#6366f1" fillOpacity={1} fill="url(#colorValue)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-900/60">
                      <h4 className="text-sm font-semibold text-slate-300">Monthly Profit History</h4>
                      <div className="h-48 mt-4 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={portfolioProfitHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                            <YAxis stroke="#64748b" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} />
                            <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "transactions" && (
                  <div className="space-y-6 overflow-x-auto">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-300 mb-4">Deposits Queue</h4>
                      <table className="w-full text-left text-xs text-slate-400">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-500 uppercase tracking-wider font-semibold">
                            <th className="py-2">Deposit ID</th>
                            <th className="py-2">Date</th>
                            <th className="py-2">Plan</th>
                            <th className="py-2 text-right">Amount</th>
                            <th className="py-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deposits.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-3 text-center text-slate-500">No deposits initiated yet.</td>
                            </tr>
                          ) : (
                            deposits.map((d, i) => (
                              <tr key={i} className="border-b border-slate-900/60 hover:bg-slate-900/20">
                                <td className="py-3 font-semibold text-white truncate max-w-[80px]">{d.id}</td>
                                <td className="py-3">{new Date(d.createdAt).toLocaleDateString()}</td>
                                <td className="py-3">{d.plan?.name}</td>
                                <td className="py-3 text-right font-bold text-white">${d.amount.toLocaleString()}</td>
                                <td className="py-3 text-right">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" : d.status === "PENDING" ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>
                                    {d.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-6 border-t border-slate-900/60">
                      <h4 className="text-sm font-semibold text-slate-300 mb-4">Withdrawals Queue</h4>
                      <table className="w-full text-left text-xs text-slate-400">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-500 uppercase tracking-wider font-semibold">
                            <th className="py-2">Withdrawal ID</th>
                            <th className="py-2">Date</th>
                            <th className="py-2">Wallet Address</th>
                            <th className="py-2 text-right">Amount</th>
                            <th className="py-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {withdrawals.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-3 text-center text-slate-500">No withdrawal records found.</td>
                            </tr>
                          ) : (
                            withdrawals.map((withdrawal) => (
                              <tr key={withdrawal.id} className="border-b border-slate-900/60 hover:bg-slate-900/20">
                                <td className="py-3 font-semibold text-white truncate max-w-[80px]">{withdrawal.id}</td>
                                <td className="py-3">{new Date(withdrawal.createdAt).toLocaleDateString()}</td>
                                <td className="py-3 font-mono max-w-[180px] truncate">{withdrawal.address}</td>
                                <td className="py-3 text-right font-bold text-white">${withdrawal.amount.toLocaleString()}</td>
                                <td className="py-3 text-right">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${withdrawal.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" : withdrawal.status === "PROCESSING" ? "bg-indigo-500/10 text-indigo-300" : withdrawal.status === "PENDING" ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>
                                    {withdrawal.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SIDEBAR WIDGETS */}
            <div className="space-y-8">
              {/* NOTIFICATIONS */}
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm">
                <h4 className="text-sm font-semibold mb-4 text-slate-300 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-400" /> System Notifications
                </h4>
                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <div className="text-xs text-slate-500 text-center py-4">No notifications yet.</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`p-4 bg-slate-950/50 border rounded-2xl transition-colors ${!n.read ? "border-indigo-500/30 bg-indigo-500/5" : "border-slate-900 hover:border-slate-800"}`}>
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <div className="flex items-center gap-1.5">
                            {!n.read && <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0 animate-pulse" />}
                            <h5 className="font-bold text-xs text-slate-200">{n.title}</h5>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-slate-500">{new Date(n.createdAt).toLocaleDateString()}</span>
                            {!n.read && (
                              <button
                                onClick={() => handleMarkAsRead(n.id)}
                                className="text-[9px] text-indigo-450 hover:text-indigo-400 font-bold uppercase tracking-wider transition-colors"
                              >
                                Dismiss
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* RECENT ACTIVITIES */}
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm">
                <h4 className="text-sm font-semibold mb-4 text-slate-300 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" /> Recent Transactions
                </h4>
                <div className="space-y-4">
                  {transactions.length === 0 ? (
                    <div className="text-xs text-slate-500 text-center py-4">No transactions recorded.</div>
                  ) : (
                    transactions.map((t, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-slate-900/60 last:border-b-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.type === "WITHDRAWAL" || t.amount < 0 ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                            {t.type === "WITHDRAWAL" || t.amount < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-slate-200 truncate">{t.description}</h5>
                            <span className="text-[10px] text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className={`font-bold ml-2 shrink-0 ${t.type === "WITHDRAWAL" || t.amount < 0 ? "text-red-400" : "text-emerald-400"}`}>
                          {t.type === "WITHDRAWAL" || t.amount < 0 ? "-" : "+"}${Math.abs(t.amount).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </main>

      {/* MOBILE DRAWER */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md lg:hidden flex">
          <div className="w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between h-full">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-indigo-400 w-6 h-6" />
                  <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                    Vestriq
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    router.push("/dashboard");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600/10 text-indigo-300 rounded-xl text-sm font-semibold border border-indigo-500/20 text-left"
                >
                  <Briefcase className="w-5 h-5" /> Portfolio Overview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    router.push("/dashboard/plans");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-900/50 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-colors text-left"
                >
                  <ShieldCheck className="w-5 h-5" /> Investment Plans
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    router.push("/dashboard/deposit");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-900/50 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-colors text-left"
                >
                  <Wallet className="w-5 h-5" /> Deposit Funds
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    router.push("/dashboard/withdraw");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-900/50 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-colors text-left"
                >
                  <ArrowDownLeft className="w-5 h-5" /> Request Payout
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      router.push("/admin");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-650/10 text-indigo-400 hover:text-indigo-300 rounded-xl text-sm font-semibold border border-transparent transition-colors text-left"
                  >
                    <ShieldCheck className="w-5 h-5 text-indigo-400" /> Admin Control
                  </button>
                )}
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileNavOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl text-sm font-semibold transition-all"
              >
                <LogOut className="w-5 h-5" /> Log Out
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileNavOpen(false)} />
        </div>
      )}
    </div>
  );
}
