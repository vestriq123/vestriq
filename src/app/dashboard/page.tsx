"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, DollarSign, ArrowUpRight, Bell, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, ResponsiveContainer } from "recharts";
import { DEFAULT_DAILY_GROWTH_RATE } from "@/lib/constants";
import { DashboardShell } from "@/components/common/DashboardShell";
import { chartTheme, ChartTooltip } from "@/components/common/ChartCard";
import { TransactionRow, type TransactionInfo } from "@/components/common/TransactionRow";
import { StatTile } from "@/components/ui/StatTile";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge, statusToVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard, Skeleton } from "@/components/ui/Skeleton";
import { TableContainer, Table, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";

export default function UserDashboardPage() {
  const [activeTab, setActiveTab] = useState<"analytics" | "investments" | "transactions">("analytics");

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
    companyName?: string | null;
    plan?: { id: string; name: string; dailyGrowthRate?: number; isGrowthPaused?: boolean } | null;
    planId?: string;
    performanceRecords?: {
      id: string;
      amount: number;
      type: string;
      note?: string | null;
      createdAt: string;
    }[];
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
    isGrowthPaused?: boolean;
    customDailyGrowthRate?: number | null;
    pausedReason?: string | null;
    updatedAt: string;
    user?: {
      email?: string;
      username?: string;
    };
  }

  const [deposits, setDeposits] = useState<DepositInfo[]>([]);
  const [investments, setInvestments] = useState<InvestmentInfo[]>([]);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [notifications, setNotifications] = useState<NotificationInfo[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalInfo[]>([]);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [timeTick, setTimeTick] = useState(Date.now());

  interface PlanData {
    id: string;
    name: string;
    description: string;
    minAmount: number;
    maxAmount: number;
    dailyGrowthRate?: number;
    isGrowthPaused?: boolean;
  }
  const [availablePlans, setAvailablePlans] = useState<PlanData[]>([]);
  const [upgradingInvestment, setUpgradingInvestment] = useState<InvestmentInfo | null>(null);
  const [selectedUpgradePlanId, setSelectedUpgradePlanId] = useState("");
  const [upgradingLoading, setUpgradingLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  const fetchAvailablePlans = async () => {
    try {
      const res = await fetch("/api/investment-plans");
      const json = await res.json();
      if (json.success) setAvailablePlans(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenUpgradeModal = (inv: InvestmentInfo) => {
    setUpgradingInvestment(inv);
    setSelectedUpgradePlanId("");
    setUpgradeError("");
  };

  const handleUpgradeSubmit = async () => {
    if (!upgradingInvestment || !selectedUpgradePlanId) return;
    setUpgradingLoading(true);
    setUpgradeError("");
    try {
      const res = await fetch(`/api/investments/${upgradingInvestment.id}/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedUpgradePlanId }),
      });
      const json = await res.json();
      if (json.success) {
        setUpgradingInvestment(null);
        fetchAllData();
      } else {
        setUpgradeError(json.error?.message || "Failed to upgrade investment plan");
      }
    } catch (err) {
      console.error(err);
      setUpgradeError("Network error occurred during upgrade");
    } finally {
      setUpgradingLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => setTimeTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const [depRes, invRes, txRes, notifRes, withdrawalRes, profileRes] = await Promise.all([
        fetch("/api/deposits"),
        fetch("/api/investments"),
        fetch("/api/transactions"),
        fetch("/api/notifications"),
        fetch("/api/withdrawals"),
        fetch("/api/profile"),
      ]);

      const depJson = await depRes.json();
      const invJson = await invRes.json();
      const txJson = await txRes.json();
      const notifJson = await notifRes.json();
      const withdrawalJson = await withdrawalRes.json();
      const profileJson = await profileRes.json();

      if (depJson.success) setDeposits(depJson.data);
      if (invJson.success) setInvestments(invJson.data);
      if (txJson.success) setTransactions(txJson.data);
      if (notifJson.success) setNotifications(notifJson.data);
      if (withdrawalJson.success) setWithdrawals(withdrawalJson.data);
      if (profileJson.success) setProfile(profileJson.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    fetchAvailablePlans();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      if (res.ok) {
        const notifRes = await fetch("/api/notifications");
        const notifJson = await notifRes.json();
        if (notifJson.success) setNotifications(notifJson.data);
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const isAccountPaused =
    profile?.isGrowthPaused === true ||
    (profile?.user?.email === "investor@vestriq.com" && (profile?.isGrowthPaused ?? true));
  const effectiveCustomRate = isAccountPaused ? 0 : (profile?.customDailyGrowthRate ?? DEFAULT_DAILY_GROWTH_RATE);

  const liveInvestments = investments.map((inv) => {
    if (inv.status !== "ACTIVE") return inv;
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysElapsed = Math.floor((timeTick - new Date(inv.createdAt).getTime()) / msPerDay);
    const planRate = inv.plan?.isGrowthPaused ? 0 : (inv.plan?.dailyGrowthRate ?? DEFAULT_DAILY_GROWTH_RATE);
    const rate = isAccountPaused ? 0 : (profile?.customDailyGrowthRate ?? planRate);
    return { ...inv, balance: inv.amount * Math.pow(1 + rate, daysElapsed) };
  });

  const calculatedPortfolioValue = liveInvestments.reduce((acc, inv) => acc + inv.balance, 0);
  const calculatedTotalInvested = liveInvestments.reduce((acc, inv) => acc + inv.amount, 0);
  const calculatedWithdrawalTotal = withdrawals.reduce((total, w) => total + w.amount, 0);

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSinceUpdate = profile?.updatedAt ? Math.floor((timeTick - new Date(profile.updatedAt).getTime()) / msPerDay) : 0;

  const portfolioValue =
    profile?.customPortfolioValue !== null && profile?.customPortfolioValue !== undefined
      ? profile.customPortfolioValue * Math.pow(1 + effectiveCustomRate, daysSinceUpdate)
      : calculatedPortfolioValue;

  const totalInvested =
    profile?.customTotalInvestment !== null && profile?.customTotalInvestment !== undefined ? profile.customTotalInvestment : calculatedTotalInvested;

  const totalProfit =
    profile?.customTotalProfit !== null && profile?.customTotalProfit !== undefined
      ? profile.customTotalProfit * Math.pow(1 + effectiveCustomRate, daysSinceUpdate)
      : portfolioValue - totalInvested;

  const approvedWithdrawalTotal =
    profile?.customWithdrawal !== null && profile?.customWithdrawal !== undefined ? profile.customWithdrawal : calculatedWithdrawalTotal;

  const activePlanCount = liveInvestments.filter((inv) => inv.status === "ACTIVE").length;
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

  const activeInvestments = liveInvestments.filter((inv) => inv.status === "ACTIVE");

  return (
    <DashboardShell active="overview" title="Portfolio Overview" subtitle="Real-time assets allocation logs">
      {loadingData ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <Skeleton className="xl:col-span-2 h-[400px] rounded-card" />
            <div className="space-y-8">
              <Skeleton className="h-56 rounded-card" />
              <Skeleton className="h-48 rounded-card" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* PAUSED ACCOUNT NOTIFICATION BANNER */}
          {isAccountPaused && (
            <div className="p-4 md:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-200 shadow-lg shadow-amber-500/5 mb-6">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-amber-100">Account Temporarily Paused</h4>
                    <Badge variant="pending">Growth Suspended</Badge>
                  </div>
                  <p className="text-xs text-amber-200/80 mt-1 max-w-2xl leading-relaxed">
                    {profile?.pausedReason || "Your account is temporarily paused until deposit is made to keep up with the investment growth."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <a href="/dashboard/deposit" className="w-full sm:w-auto">
                  <Button size="sm" className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-none shadow-md shadow-amber-500/20">
                    Make Deposit
                  </Button>
                </a>
              </div>
            </div>
          )}

          {/* STAT TILES */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatTile
              label="Portfolio Value"
              value={`$${portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              icon={<TrendingUp className="w-4 h-4" />}
              tone={isAccountPaused ? "neutral" : "profit"}
              delta={isAccountPaused ? "Paused" : `+$${totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              deltaPositive={!isAccountPaused}
              subtext={isAccountPaused ? "Compounding Paused" : "Valuation"}
            />
            <StatTile
              label="Total Invested"
              value={`$${totalInvested.toLocaleString()}`}
              icon={<DollarSign className="w-4 h-4" />}
              tone="brand"
              subtext={`Across ${activePlanCount} Active ${activePlanCount === 1 ? "Plan" : "Plans"}`}
            />
            <StatTile
              label="Total Profit"
              value={`$${totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              icon={<TrendingUp className="w-4 h-4" />}
              tone={isAccountPaused ? "neutral" : "profit"}
              delta={isAccountPaused ? "Paused" : `+${totalInvested > 0 ? Math.round((totalProfit / totalInvested) * 100) : 0}%`}
              deltaPositive={!isAccountPaused}
              subtext={isAccountPaused ? "Increment Suspended" : "Total Increment"}
            />
            <StatTile
              label="Withdrawals"
              value={`$${approvedWithdrawalTotal.toLocaleString()}`}
              icon={<ArrowUpRight className="w-4 h-4" />}
              tone="loss"
              subtext="Total Requested Payout"
            />
          </div>

          {/* MAIN WORKSPACE */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <Card className="xl:col-span-2 flex flex-col">
              <CardHeader className="justify-start">
                <Tabs
                  variant="pill"
                  activeId={activeTab}
                  onChange={(id) => setActiveTab(id as typeof activeTab)}
                  items={[
                    { id: "analytics", label: "Performance Charts" },
                    { id: "investments", label: "My Holdings" },
                    { id: "transactions", label: "Tables Logs" },
                  ]}
                />
              </CardHeader>

              <CardBody className="flex-1">
                {activeTab === "analytics" && (
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-sm font-semibold text-text-secondary mb-2">Portfolio Growth</h4>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={portfolioGrowthData}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartTheme.seriesBrand} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={chartTheme.seriesBrand} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                            <XAxis dataKey="name" stroke={chartTheme.axis} fontSize={10} />
                            <YAxis stroke={chartTheme.axis} fontSize={10} />
                            <Tooltip content={<ChartTooltip formatter={(v) => `$${v.toLocaleString()}`} />} cursor={{ stroke: chartTheme.grid }} />
                            <Area type="monotone" dataKey="value" name="Portfolio Value" stroke={chartTheme.seriesBrand} fillOpacity={1} fill="url(#colorValue)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border-subtle">
                      <h4 className="text-sm font-semibold text-text-secondary mb-2">Monthly Profit History</h4>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={portfolioProfitHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                            <XAxis dataKey="name" stroke={chartTheme.axis} fontSize={10} />
                            <YAxis stroke={chartTheme.axis} fontSize={10} />
                            <Tooltip content={<ChartTooltip formatter={(v) => `$${v.toLocaleString()}`} />} cursor={{ fill: chartTheme.grid, opacity: 0.3 }} />
                            <Bar dataKey="profit" name="Profit" fill={chartTheme.seriesProfit} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "investments" && (
                  <div className="space-y-6">
                    <h4 className="text-sm font-semibold text-text-secondary">My Active Investments</h4>
                    {activeInvestments.length === 0 ? (
                      <EmptyState title="No active investments yet" description="Deposit funds to start earning on a plan." />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeInvestments.map((inv) => {
                          const profit = inv.balance - inv.amount;
                          const rate = inv.plan?.dailyGrowthRate ?? DEFAULT_DAILY_GROWTH_RATE;
                          return (
                            <Card key={inv.id} className="p-5 space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400">{inv.plan?.name || "Standard Plan"}</span>
                                  <h4 className="font-bold text-sm text-text-primary mt-1">{inv.companyName || "Diversified Index"}</h4>
                                </div>
                                {isAccountPaused || inv.plan?.isGrowthPaused ? (
                                  <Badge variant="pending">Growth Paused</Badge>
                                ) : (
                                  <Badge variant="active">+{(rate * 100).toFixed(2)}% Daily</Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-subtle">
                                <div>
                                  <span className="text-[9px] text-text-muted block">Total Invested</span>
                                  <span className="font-bold text-xs text-text-secondary tabular-nums">
                                    ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-text-muted block">Live Profit</span>
                                  <span className="font-bold text-xs text-profit tabular-nums">
                                    +${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-text-muted block">Growth Valuation</span>
                                  <span className="font-bold text-xs text-text-primary tabular-nums">
                                    ${inv.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                              <div className="pt-3 border-t border-border-subtle flex justify-end">
                                <Button size="sm" onClick={() => handleOpenUpgradeModal(inv)}>
                                  Upgrade Plan
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "transactions" && (
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-sm font-semibold text-text-secondary mb-3">Deposits Queue</h4>
                      {deposits.length === 0 ? (
                        <EmptyState title="No deposits initiated yet" />
                      ) : (
                        <TableContainer>
                          <Table>
                            <Thead>
                              <tr>
                                <Th>Deposit ID</Th>
                                <Th>Date</Th>
                                <Th>Plan</Th>
                                <Th className="text-right">Amount</Th>
                                <Th className="text-right">Status</Th>
                              </tr>
                            </Thead>
                            <Tbody>
                              {deposits.map((d) => (
                                <Tr key={d.id}>
                                  <Td className="font-semibold text-text-primary truncate max-w-[100px]">{d.id}</Td>
                                  <Td>{new Date(d.createdAt).toLocaleDateString()}</Td>
                                  <Td>{d.plan?.name}</Td>
                                  <Td className="text-right font-bold text-text-primary">${d.amount.toLocaleString()}</Td>
                                  <Td className="text-right">
                                    <Badge variant={statusToVariant(d.status)}>{d.status}</Badge>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </TableContainer>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-text-secondary mb-3">Withdrawals Queue</h4>
                      {withdrawals.length === 0 ? (
                        <EmptyState title="No withdrawal records found" />
                      ) : (
                        <TableContainer>
                          <Table>
                            <Thead>
                              <tr>
                                <Th>Withdrawal ID</Th>
                                <Th>Date</Th>
                                <Th>Destination</Th>
                                <Th className="text-right">Amount</Th>
                                <Th className="text-right">Status</Th>
                              </tr>
                            </Thead>
                            <Tbody>
                              {withdrawals.map((w) => (
                                <Tr key={w.id}>
                                  <Td className="font-semibold text-text-primary truncate max-w-[100px]">{w.id}</Td>
                                  <Td>{new Date(w.createdAt).toLocaleDateString()}</Td>
                                  <Td className="font-mono max-w-[180px] truncate">{w.address}</Td>
                                  <Td className="text-right font-bold text-text-primary">${w.amount.toLocaleString()}</Td>
                                  <Td className="text-right">
                                    <Badge variant={statusToVariant(w.status)}>{w.status}</Badge>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </TableContainer>
                      )}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* SIDEBAR WIDGETS */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <h4 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                    <Bell className="w-4 h-4 text-brand-400" /> System Notifications
                  </h4>
                </CardHeader>
                <CardBody className="space-y-3">
                  {notifications.length === 0 ? (
                    <EmptyState icon={<Bell className="w-5 h-5" />} title="No notifications yet" />
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 border rounded-2xl transition-colors ${!n.read ? "border-brand-500/30 bg-brand-500/5" : "border-border-subtle bg-surface-1/40 hover:border-border-strong"}`}
                      >
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <div className="flex items-center gap-1.5">
                            {!n.read && <span className="w-1.5 h-1.5 bg-brand-400 rounded-full shrink-0 animate-pulse" />}
                            <h5 className="font-bold text-xs text-text-primary">{n.title}</h5>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-text-muted">{new Date(n.createdAt).toLocaleDateString()}</span>
                            {!n.read && (
                              <button
                                onClick={() => handleMarkAsRead(n.id)}
                                className="text-[9px] text-brand-400 hover:text-brand-300 font-bold uppercase tracking-wider transition-colors"
                              >
                                Dismiss
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-text-muted leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h4 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" /> Recent Transactions
                  </h4>
                </CardHeader>
                <CardBody className="divide-y divide-border-subtle">
                  {transactions.length === 0 ? (
                    <EmptyState icon={<Clock className="w-5 h-5" />} title="No transactions recorded" />
                  ) : (
                    transactions.map((t) => <TransactionRow key={t.id} tx={t} />)
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* UPGRADE PLAN MODAL */}
      <Modal
        open={!!upgradingInvestment}
        onClose={() => setUpgradingInvestment(null)}
        title="Upgrade Investment Package"
        description={`Transition your active holding ${upgradingInvestment?.companyName || "Diversified Index"} to a higher yielding wealth structure.`}
      >
        {upgradeError && <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-xl mb-4">{upgradeError}</div>}

        <div className="mb-5">
          <label className="block text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-2">Current Active Plan</label>
          <div className="bg-surface-1 border border-border-subtle rounded-xl p-3 text-xs flex justify-between">
            <span className="font-semibold text-text-primary">{upgradingInvestment?.plan?.name || "Standard Plan"}</span>
            <span className="font-mono text-text-muted">${upgradingInvestment?.amount.toLocaleString()} Principal</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-[10px] text-text-muted uppercase tracking-wider font-semibold">Select New Upgrade Package</label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availablePlans
              .filter((p) => p.id !== upgradingInvestment?.plan?.id)
              .map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedUpgradePlanId(plan.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex justify-between items-center ${
                    selectedUpgradePlanId === plan.id ? "bg-brand-600/10 border-brand-500 text-brand-300" : "bg-surface-1 border-border-subtle text-text-muted hover:border-border-strong"
                  }`}
                >
                  <div>
                    <h5 className="font-bold text-xs text-text-primary">{plan.name}</h5>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      Limits: ${plan.minAmount.toLocaleString()} - ${plan.maxAmount.toLocaleString()}
                    </p>
                  </div>
                  {typeof plan.dailyGrowthRate === "number" && <Badge variant="approved">{(plan.dailyGrowthRate * 100).toFixed(2)}%/day</Badge>}
                </button>
              ))}
            {availablePlans.filter((p) => p.id !== upgradingInvestment?.plan?.id).length === 0 && (
              <p className="text-xs text-text-muted italic text-center py-4">No other upgrade plans available.</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-5 mt-5 border-t border-border-subtle">
          <Button onClick={handleUpgradeSubmit} isLoading={upgradingLoading} disabled={!selectedUpgradePlanId} className="flex-1">
            Confirm Upgrade
          </Button>
          <Button variant="outline" onClick={() => setUpgradingInvestment(null)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </DashboardShell>
  );
}
