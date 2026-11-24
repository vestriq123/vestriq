"use client";

import React, { useState, useEffect } from "react";
import {
  Users as UsersIcon,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Edit,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { AdminShell, type AdminTabId } from "@/components/common/AdminShell";
import { ChartCard, chartTheme, ChartTooltip } from "@/components/common/ChartCard";
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Button } from "@/components/ui/Button";
import { Badge, statusToVariant } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableContainer, Table, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { cn } from "@/lib/cn";

interface AnalyticsWeekPoint {
  weekLabel: string;
  weekStart: string;
  deposits: number;
  withdrawals: number;
  newUsers: number;
}
interface AnalyticsSummary {
  weekly: AnalyticsWeekPoint[];
  totals: { deposits: number; withdrawals: number; netFlow: number; newUsers: number };
}

interface InvestmentData {
  id: string;
  amount: number;
  balance: number;
  status: string;
  createdAt: string;
  user?: {
    username: string;
    email: string;
    profile?: { fullName: string } | null;
  } | null;
  plan?: { name: string } | null;
  performanceRecords?: {
    id: string;
    amount: number;
    type: string;
    note?: string | null;
    createdAt: string;
  }[];
}

function investorName(investment: InvestmentData) {
  return investment.user?.profile?.fullName || investment.user?.username || investment.user?.email || "Investor";
}

function planName(investment: InvestmentData) {
  return investment.plan?.name || "Investment Plan";
}

function signedPerformanceAmount(amount: number, type: string) {
  if (type === "LOSS") return -Math.abs(amount);
  if (type === "ADJUSTMENT") return amount;
  return Math.abs(amount);
}

function formatPayoutDetails(address: string) {
  if (address && address.startsWith("[")) {
    const endIdx = address.indexOf("]");
    if (endIdx !== -1) {
      const method = address.slice(1, endIdx);
      const details = address.slice(endIdx + 1);
      return { method, details };
    }
  }
  return { method: "CRYPTO WALLET", details: address };
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTabId>("overview");

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");

  // Investment adjustment state
  const [selectedInvestment, setSelectedInvestment] = useState<InvestmentData | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("PROFIT");
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [adjustmentDate, setAdjustmentDate] = useState("");
  const [deletingRecordId, setDeletingRecordId] = useState("");
  const [adjustmentError, setAdjustmentError] = useState("");
  const [savingAdjustment, setSavingAdjustment] = useState(false);

  interface WalletAddressData {
    id: string;
    name: string;
    address: string;
    qrCodeUrl?: string | null;
    enabled: boolean;
  }
  const [walletAddresses, setWalletAddresses] = useState<WalletAddressData[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(false);
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [walletForm, setWalletForm] = useState({ id: "", name: "", address: "", enabled: true });
  const [walletError, setWalletError] = useState("");
  const [savingWallet, setSavingWallet] = useState(false);

  interface UserProfile {
    fullName: string | null;
    customPortfolioValue: number | null;
    customTotalInvestment: number | null;
    customTotalProfit: number | null;
    customWithdrawal: number | null;
    customAvailableCash: number | null;
    isGrowthPaused?: boolean;
    customDailyGrowthRate?: number | null;
    pausedReason?: string | null;
    idDocumentType: string | null;
    idDocumentUrl: string | null;
    ssn: string | null;
  }
  interface UserData {
    id: string;
    email: string;
    username: string;
    createdAt: string;
    verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
    role?: { name: string } | null;
    profile?: UserProfile | null;
  }
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState("");
  const [selectedUserForOverride, setSelectedUserForOverride] = useState<UserData | null>(null);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserData | null>(null);
  const [overridePortfolioValue, setOverridePortfolioValue] = useState("");
  const [overrideTotalInvestment, setOverrideTotalInvestment] = useState("");
  const [overrideTotalProfit, setOverrideTotalProfit] = useState("");
  const [overrideWithdrawal, setOverrideWithdrawal] = useState("");
  const [overrideAvailableCash, setOverrideAvailableCash] = useState("");
  const [overrideIsGrowthPaused, setOverrideIsGrowthPaused] = useState(false);
  const [overrideDailyGrowthRate, setOverrideDailyGrowthRate] = useState("");
  const [overridePausedReason, setOverridePausedReason] = useState("");
  const [savingOverrides, setSavingOverrides] = useState(false);
  const [overrideError, setOverrideError] = useState("");

  // Manual Investment state
  const [creditUserId, setCreditUserId] = useState("");
  const [creditPlanId, setCreditPlanId] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [submittingCredit, setSubmittingCredit] = useState(false);
  const [creditMessage, setCreditMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleManualCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditUserId || !creditPlanId || !creditAmount) return;
    setSubmittingCredit(true);
    setCreditMessage(null);
    try {
      const res = await fetch(`/api/users/${creditUserId}/manual-invest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(creditAmount), planId: creditPlanId }),
      });
      const data = await res.json();
      if (data.success) {
        setCreditMessage({ text: `Successfully credited $${Number(creditAmount).toLocaleString()} to the user's account!`, type: "success" });
        setCreditAmount("");
        fetchUsers();
        fetchInvestments();
        fetchDeposits();
      } else {
        setCreditMessage({ text: data.error?.message || "Failed to process manual credit", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setCreditMessage({ text: "Network error occurred", type: "error" });
    } finally {
      setSubmittingCredit(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDeleteUser = async (user: UserData) => {
    if (!confirm(`Are you sure you want to delete ${user.profile?.fullName || user.username}? This will remove their access to the platform.`)) return;
    setDeletingUserId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error?.message || "Failed to delete user");
      }
    } catch (err) {
      console.error(err);
      alert("Network error occurred while deleting user");
    } finally {
      setDeletingUserId("");
    }
  };

  const handleOpenOverrideModal = (user: UserData) => {
    setSelectedUserForOverride(user);
    setOverridePortfolioValue(user.profile?.customPortfolioValue?.toString() || "");
    setOverrideTotalInvestment(user.profile?.customTotalInvestment?.toString() || "");
    setOverrideTotalProfit(user.profile?.customTotalProfit?.toString() || "");
    setOverrideWithdrawal(user.profile?.customWithdrawal?.toString() || "");
    setOverrideAvailableCash(user.profile?.customAvailableCash?.toString() || "");
    setOverrideIsGrowthPaused(user.profile?.isGrowthPaused ?? false);
    setOverrideDailyGrowthRate(user.profile?.customDailyGrowthRate !== null && user.profile?.customDailyGrowthRate !== undefined ? (user.profile.customDailyGrowthRate * 100).toString() : "");
    setOverridePausedReason(user.profile?.pausedReason || "Your account is temporarily paused until deposit is made to keep up with the investment growth.");
    setOverrideError("");
  };

  const handleSaveOverrides = async () => {
    if (!selectedUserForOverride) return;
    setSavingOverrides(true);
    setOverrideError("");
    try {
      const res = await fetch(`/api/users/${selectedUserForOverride.id}/stats`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioValue: overridePortfolioValue === "" ? null : Number(overridePortfolioValue),
          totalInvestment: overrideTotalInvestment === "" ? null : Number(overrideTotalInvestment),
          totalProfit: overrideTotalProfit === "" ? null : Number(overrideTotalProfit),
          withdrawal: overrideWithdrawal === "" ? null : Number(overrideWithdrawal),
          availableCash: overrideAvailableCash === "" ? null : Number(overrideAvailableCash),
          isGrowthPaused: overrideIsGrowthPaused,
          dailyGrowthRate: overrideDailyGrowthRate === "" ? null : Number(overrideDailyGrowthRate),
          pausedReason: overridePausedReason || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedUserForOverride(null);
        fetchUsers();
      } else {
        setOverrideError(data.error?.message || "Failed to update overrides");
      }
    } catch (err) {
      console.error(err);
      setOverrideError("Network error occurred while saving overrides");
    } finally {
      setSavingOverrides(false);
    }
  };

  const toggleUserGrowthPause = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/toggle-growth-pause`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to toggle growth pause for user", err);
    }
  };

  const [investments, setInvestments] = useState<InvestmentData[]>([]);
  const [loadingInvestments, setLoadingInvestments] = useState(false);

  const fetchInvestments = async () => {
    setLoadingInvestments(true);
    try {
      const res = await fetch("/api/investments?all=true");
      const data = await res.json();
      if (data.success) setInvestments(data.data);
    } catch (err) {
      console.error("Failed to fetch investments", err);
    } finally {
      setLoadingInvestments(false);
    }
  };

  interface PlanData {
    id: string;
    name: string;
    description: string;
    minAmount: number;
    maxAmount: number;
    dailyGrowthRate: number;
    isGrowthPaused: boolean;
    durationMonths: number;
    enabled: boolean;
  }
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  // dailyGrowthRate is edited in the form as a percentage (e.g. 0.3 = 0.3%/day)
  // and converted to/from the decimal value (0.003) the API stores.
  const emptyPlanForm = { id: "", name: "", description: "", minAmount: 0, maxAmount: 0, dailyGrowthRate: 0.3, isGrowthPaused: false, durationMonths: 3, enabled: true };
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planError, setPlanError] = useState("");

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await fetch("/api/investment-plans?all=true");
      const data = await res.json();
      if (data.success) setPlans(data.data);
    } catch (err) {
      console.error("Failed to fetch plans", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  interface DepositData {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    user?: { username: string; email: string; profile?: { fullName: string } | null } | null;
    plan?: { name: string } | null;
    wallet?: { name: string } | null;
  }
  const [deposits, setDeposits] = useState<DepositData[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);

  const [approvingDeposit, setApprovingDeposit] = useState<DepositData | null>(null);
  const [confirmedDepositAmount, setConfirmedDepositAmount] = useState("");
  const [updatePortfolioOverride, setUpdatePortfolioOverride] = useState(true);
  const [approvingDepositError, setApprovingDepositError] = useState("");
  const [submittingApproval, setSubmittingApproval] = useState(false);

  interface WithdrawalData {
    id: string;
    amount: number;
    address: string;
    status: string;
    createdAt: string;
    user?: { username: string; email: string; profile?: { fullName: string } | null } | null;
  }
  const [withdrawals, setWithdrawals] = useState<WithdrawalData[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch("/api/admin/analytics?weeks=8");
      const data = await res.json();
      if (data.success) setAnalytics(data.data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchDeposits = async () => {
    setLoadingDeposits(true);
    try {
      const res = await fetch("/api/deposits");
      const data = await res.json();
      if (data.success) setDeposits(data.data);
    } catch (err) {
      console.error("Failed to fetch deposits", err);
    } finally {
      setLoadingDeposits(false);
    }
  };

  const fetchWithdrawals = async () => {
    setLoadingWithdrawals(true);
    try {
      const res = await fetch("/api/withdrawals");
      const data = await res.json();
      if (data.success) setWithdrawals(data.data);
    } catch (err) {
      console.error("Failed to fetch withdrawals", err);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const fetchWallets = async () => {
    setLoadingWallets(true);
    try {
      const res = await fetch("/api/wallets");
      const data = await res.json();
      if (data.success) setWalletAddresses(data.data);
    } catch (err) {
      console.error("Failed to fetch wallets", err);
    } finally {
      setLoadingWallets(false);
    }
  };

  const handleApproveDepositSubmit = async () => {
    if (!approvingDeposit) return;
    setSubmittingApproval(true);
    setApprovingDepositError("");
    try {
      const confirmedAmount = confirmedDepositAmount ? Number(confirmedDepositAmount) : undefined;
      const res = await fetch(`/api/deposits/${approvingDeposit.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmedAmount, updatePortfolioOverride }),
      });
      const data = await res.json();
      if (data.success) {
        setApprovingDeposit(null);
        fetchDeposits();
        fetchUsers();
        fetchInvestments();
      } else {
        setApprovingDepositError(data.error?.message || "Failed to approve deposit");
      }
    } catch (err) {
      console.error(err);
      setApprovingDepositError("Network error occurred while approving deposit");
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleRejectDeposit = async (id: string) => {
    try {
      const res = await fetch(`/api/deposits/${id}/reject`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchDeposits();
      } else {
        alert(data.error?.message || "Failed to reject deposit");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveWithdrawal = async (id: string) => {
    try {
      const res = await fetch(`/api/withdrawals/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchWithdrawals();
      } else {
        alert(data.error?.message || "Failed to approve withdrawal");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    try {
      const res = await fetch(`/api/withdrawals/${id}/reject`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchWithdrawals();
      } else {
        alert(data.error?.message || "Failed to reject withdrawal");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchDeposits();
    fetchWithdrawals();
    fetchInvestments();
    fetchWallets();
    fetchUsers();
    fetchAnalytics();
  }, []);

  const toggleWalletStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/wallets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentStatus }),
      });
      const result = await res.json();
      if (result.success) {
        fetchWallets();
      } else {
        alert(result.error?.message || "Failed to update wallet status");
      }
    } catch (err) {
      console.error("Failed to update wallet status", err);
    }
  };

  const saveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalletError("");
    setSavingWallet(true);
    const url = isEditingWallet ? `/api/wallets/${walletForm.id}` : "/api/wallets";
    const method = isEditingWallet ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: walletForm.name, address: walletForm.address, enabled: walletForm.enabled }),
      });
      const result = await res.json();
      if (result.success) {
        setShowWalletForm(false);
        setWalletForm({ id: "", name: "", address: "", enabled: true });
        setIsEditingWallet(false);
        fetchWallets();
      } else {
        setWalletError(result.error?.message || "Failed to save wallet configuration");
      }
    } catch (err) {
      setWalletError("An unexpected error occurred");
      console.error(err);
    } finally {
      setSavingWallet(false);
    }
  };

  const deleteWallet = async (id: string) => {
    if (!confirm("Are you sure you want to remove this funding wallet?")) return;
    try {
      const res = await fetch(`/api/wallets/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        fetchWallets();
      } else {
        alert(result.error?.message || "Failed to delete wallet");
      }
    } catch (err) {
      console.error("Failed to delete wallet", err);
    }
  };

  const saveAdjustment = async () => {
    if (!selectedInvestment || !adjustmentAmount) return;
    setSavingAdjustment(true);
    setAdjustmentError("");
    try {
      const response = await fetch(`/api/investments/${selectedInvestment.id}/performance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: adjustmentType,
          amount: signedPerformanceAmount(Number(adjustmentAmount), adjustmentType),
          note: adjustmentNote.trim() || undefined,
          createdAt: adjustmentDate || undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSelectedInvestment(null);
        setAdjustmentAmount("");
        setAdjustmentNote("");
        setAdjustmentDate("");
        fetchInvestments();
      } else {
        setAdjustmentError(data.error?.message || "Failed to apply performance update");
      }
    } catch (err) {
      console.error(err);
      setAdjustmentError("Network error occurred while applying performance update");
    } finally {
      setSavingAdjustment(false);
    }
  };

  const handleDeletePerformanceRecord = async (recordId: string, investmentId: string) => {
    if (!confirm("Are you sure you want to delete this performance record? The investment balance will be reverted.")) return;
    setDeletingRecordId(recordId);
    try {
      const res = await fetch(`/api/investments/${investmentId}/performance?recordId=${recordId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchInvestments();
        if (selectedInvestment) {
          const updatedRecords = selectedInvestment.performanceRecords?.filter((r) => r.id !== recordId) || [];
          const recordToDelete = selectedInvestment.performanceRecords?.find((r) => r.id === recordId);
          const revertedBalance = recordToDelete ? selectedInvestment.balance - recordToDelete.amount : selectedInvestment.balance;
          setSelectedInvestment({ ...selectedInvestment, balance: revertedBalance, performanceRecords: updatedRecords });
        }
      } else {
        alert(data.error?.message || "Failed to delete performance record");
      }
    } catch (err) {
      console.error(err);
      alert("Network error occurred while deleting performance record");
    } finally {
      setDeletingRecordId("");
    }
  };

  const savePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanError("");
    const url = isEditingPlan ? `/api/investment-plans/${planForm.id}` : "/api/investment-plans";
    const method = isEditingPlan ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planForm.name,
          description: planForm.description,
          minAmount: Number(planForm.minAmount),
          maxAmount: Number(planForm.maxAmount),
          dailyGrowthRate: Number(planForm.dailyGrowthRate) / 100,
          isGrowthPaused: planForm.isGrowthPaused,
          durationMonths: Number(planForm.durationMonths),
          enabled: planForm.enabled,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setShowPlanForm(false);
        setPlanForm(emptyPlanForm);
        setIsEditingPlan(false);
        fetchPlans();
      } else {
        setPlanError(result.error?.message || "Something went wrong");
      }
    } catch (err) {
      setPlanError("An unexpected error occurred");
      console.error(err);
    }
  };

  const togglePlanStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/investment-plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentStatus }),
      });
      const result = await res.json();
      if (result.success) {
        fetchPlans();
      } else {
        alert(result.error?.message || "Failed to update plan status");
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const togglePlanGrowthPause = async (id: string, currentPaused: boolean) => {
    try {
      const res = await fetch(`/api/investment-plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isGrowthPaused: !currentPaused }),
      });
      const result = await res.json();
      if (result.success) {
        fetchPlans();
      } else {
        alert(result.error?.message || "Failed to toggle growth pause");
      }
    } catch (err) {
      console.error("Failed to toggle plan growth pause", err);
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this investment plan?")) return;
    try {
      const res = await fetch(`/api/investment-plans/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        fetchPlans();
      } else {
        alert(result.error?.message || "Failed to delete plan");
      }
    } catch (err) {
      console.error("Failed to delete plan", err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const fullName = u.profile?.fullName || "";
    const username = u.username || "";
    const email = u.email || "";
    const q = searchQuery.toLowerCase();
    return fullName.toLowerCase().includes(q) || username.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  const totalAUM = investments.filter((i) => i.status === "ACTIVE").reduce((sum, i) => sum + i.balance, 0);
  const pendingDepositsCount = deposits.filter((d) => d.status === "PENDING").length;
  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === "PROCESSING" || w.status === "PENDING").length;

  return (
    <AdminShell activeTab={activeTab} onTabChange={setActiveTab}>
      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatTile label="Assets Under Management" value={`$${totalAUM.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<DollarSign className="w-4 h-4" />} tone="brand" subtext="Across active plan holdings" />
            <StatTile label="Total Registered Users" value={users.length.toLocaleString()} icon={<UsersIcon className="w-4 h-4" />} tone="brand" subtext="All investor accounts" />
            <StatTile label="Pending Deposits" value={`${pendingDepositsCount} Requests`} icon={<ArrowDownLeft className="w-4 h-4" />} tone="pending" subtext="Verification queue alert" />
            <StatTile label="Pending Withdrawals" value={`${pendingWithdrawalsCount} Requests`} icon={<ArrowUpRight className="w-4 h-4" />} tone="pending" subtext="Payout queue alert" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Pending Deposit Funding Requests</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                {loadingDeposits ? (
                  <div className="text-xs text-text-muted">Loading pending requests...</div>
                ) : pendingDepositsCount === 0 ? (
                  <EmptyState title="No pending deposits in queue" />
                ) : (
                  deposits
                    .filter((d) => d.status === "PENDING")
                    .map((d) => (
                      <div key={d.id} className="flex justify-between items-center bg-surface-1 p-4 border border-border-subtle rounded-2xl">
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-text-primary truncate">{d.user?.profile?.fullName || d.user?.username || d.user?.email || "Investor"}</h5>
                          <span className="text-[10px] text-text-muted">{d.plan?.name} | {d.wallet?.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-sm text-profit">+${d.amount.toLocaleString()}</span>
                          <button
                            onClick={() => {
                              setApprovingDeposit(d);
                              setConfirmedDepositAmount(d.amount.toString());
                              setUpdatePortfolioOverride(true);
                              setApprovingDepositError("");
                            }}
                            className="p-1.5 hover:bg-surface-2 rounded-lg text-profit"
                            aria-label="Approve deposit"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleRejectDeposit(d.id)} className="p-1.5 hover:bg-surface-2 rounded-lg text-danger" aria-label="Reject deposit">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Withdrawal Payout Requests</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                {loadingWithdrawals ? (
                  <div className="text-xs text-text-muted">Loading payout requests...</div>
                ) : pendingWithdrawalsCount === 0 ? (
                  <EmptyState title="No withdrawal payouts in queue" />
                ) : (
                  withdrawals
                    .filter((w) => w.status === "PROCESSING" || w.status === "PENDING")
                    .map((w) => {
                      const { method, details } = formatPayoutDetails(w.address);
                      return (
                        <div key={w.id} className="flex justify-between items-center bg-surface-1 p-4 border border-border-subtle rounded-2xl">
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-text-primary truncate">{w.user?.profile?.fullName || w.user?.username || w.user?.email || "Investor"}</h5>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[9px] bg-surface-3 text-text-secondary px-1.5 py-0.5 rounded font-extrabold uppercase">{method}</span>
                              <span className="text-[10px] text-text-muted truncate max-w-[150px] block font-mono">{details}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-bold text-sm text-loss">-${w.amount.toLocaleString()}</span>
                            <button onClick={() => handleApproveWithdrawal(w.id)} className="p-1.5 hover:bg-surface-2 rounded-lg text-profit" aria-label="Approve withdrawal">
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === "users" && (
        <Card>
          <CardBody className="space-y-6">
            <div className="bg-surface-1 border border-border-subtle rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
                <Plus className="w-4 h-4 text-brand-400" />
                <div>
                  <h3 className="text-xs font-bold text-text-primary">Quick Manual Investment Credit</h3>
                  <p className="text-[10px] text-text-muted">Credit any investor account with a manual allocation</p>
                </div>
              </div>

              <form onSubmit={handleManualCreditSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <Select label="Select Investor" value={creditUserId} onChange={(e) => setCreditUserId(e.target.value)} required>
                  <option value="">-- Choose User --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.profile?.fullName || u.username} ({u.email})
                    </option>
                  ))}
                </Select>

                <Select label="Investment Plan" value={creditPlanId} onChange={(e) => setCreditPlanId(e.target.value)} required>
                  <option value="">-- Choose Plan --</option>
                  {plans.filter((p) => p.enabled).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Min: ${p.minAmount.toLocaleString()})
                    </option>
                  ))}
                </Select>

                <Input type="number" label="Amount to Add ($)" placeholder="Enter amount" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} required min="0.01" step="0.01" />

                <Button type="submit" isLoading={submittingCredit}>
                  Credit Account
                </Button>
              </form>

              {creditMessage && <p className={cn("text-[10px] font-semibold", creditMessage.type === "success" ? "text-profit" : "text-danger")}>{creditMessage.text}</p>}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-6 border-b border-border-subtle">
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-1 border border-border-subtle rounded-xl pl-9 pr-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Filter className="w-4 h-4" /> {filteredUsers.length} of {users.length} users
              </div>
            </div>

            {loadingUsers ? (
              <div className="text-center py-12 text-xs text-text-muted">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <EmptyState icon={<UsersIcon className="w-5 h-5" />} title="No users found" />
            ) : (
              <TableContainer>
                <Table>
                  <Thead>
                    <tr>
                      <Th>Name</Th>
                      <Th>Username</Th>
                      <Th>Email</Th>
                      <Th>Role</Th>
                      <Th>Joined</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </Thead>
                  <Tbody>
                    {filteredUsers.map((u) => (
                      <Tr key={u.id}>
                        <Td className="font-semibold text-text-primary">{u.profile?.fullName || "Investor"}</Td>
                        <Td className="font-mono">{u.username}</Td>
                        <Td>{u.email}</Td>
                        <Td>
                          <Badge variant={u.role?.name === "ADMIN" ? "info" : "neutral"}>{u.role?.name || "USER"}</Badge>
                        </Td>
                        <Td>{new Date(u.createdAt).toLocaleDateString()}</Td>
                        <Td>
                          <div className="flex flex-col gap-1 items-start">
                            <Badge variant={statusToVariant(u.verificationStatus || "PENDING")}>{u.verificationStatus || "PENDING"}</Badge>
                            {u.profile?.isGrowthPaused && <Badge variant="pending">Growth Paused</Badge>}
                          </div>
                        </Td>
                        <Td className="text-right">
                          <div className="flex justify-end gap-3 items-center">
                            <button
                              onClick={() => toggleUserGrowthPause(u.id)}
                              className={cn("font-semibold text-xs", u.profile?.isGrowthPaused ? "text-profit hover:text-profit/80" : "text-amber-400 hover:text-amber-300")}
                            >
                              {u.profile?.isGrowthPaused ? "Resume Growth" : "Pause Growth"}
                            </button>
                            <button onClick={() => setSelectedUserForDetails(u)} className="text-profit hover:text-profit/80 font-semibold">
                              View Details
                            </button>
                            <button onClick={() => handleOpenOverrideModal(u)} className="text-brand-400 hover:text-brand-300 font-semibold">
                              Edit Stats
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={deletingUserId === u.id}
                              className="text-danger hover:text-danger/80 font-semibold disabled:opacity-50"
                            >
                              {deletingUserId === u.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </CardBody>

          {/* OVERRIDE MODAL */}
          <Modal
            open={!!selectedUserForOverride}
            onClose={() => setSelectedUserForOverride(null)}
            title="Edit Manual Stats Override"
            description={`Override statistics for ${selectedUserForOverride?.profile?.fullName || selectedUserForOverride?.username}. Leave a field blank to clear the override and use calculated system values.`}
          >
            {overrideError && <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-xl mb-4">{overrideError}</div>}
            <div className="space-y-3">
              <Input type="number" label="Portfolio Value ($)" placeholder="Calculated automatically" value={overridePortfolioValue} onChange={(e) => setOverridePortfolioValue(e.target.value)} />
              <Input type="number" label="Total Investment ($)" placeholder="Calculated automatically" value={overrideTotalInvestment} onChange={(e) => setOverrideTotalInvestment(e.target.value)} />
              <Input type="number" label="Total Profit ($)" placeholder="Calculated automatically" value={overrideTotalProfit} onChange={(e) => setOverrideTotalProfit(e.target.value)} />
              <Input type="number" label="Withdrawals ($)" placeholder="Calculated automatically" value={overrideWithdrawal} onChange={(e) => setOverrideWithdrawal(e.target.value)} />
              <Input type="number" label="Available Cash ($)" placeholder="Calculated automatically" value={overrideAvailableCash} onChange={(e) => setOverrideAvailableCash(e.target.value)} />

              <div className="pt-2 border-t border-border-subtle space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-1 border border-border-subtle">
                  <div>
                    <span className="text-xs font-semibold text-text-primary block">Pause Daily Increment</span>
                    <span className="text-[10px] text-text-muted">Freeze daily portfolio compounding for this user</span>
                  </div>
                  <input
                    type="checkbox"
                    id="overrideIsGrowthPaused"
                    checked={overrideIsGrowthPaused}
                    onChange={(e) => setOverrideIsGrowthPaused(e.target.checked)}
                    className="w-4 h-4 rounded bg-surface-0 border-border-default text-brand-500 focus:ring-brand-500/20"
                  />
                </div>

                <Input
                  type="number"
                  label="Custom Daily Growth Rate (%)"
                  placeholder="0.3 (leave blank for system default)"
                  step="0.01"
                  min="0"
                  max="100"
                  value={overrideDailyGrowthRate}
                  onChange={(e) => setOverrideDailyGrowthRate(e.target.value)}
                  hint="Adjust or increase/reduce daily growth percentage for this user (e.g. 0.3 = 0.3%/day)"
                />

                {overrideIsGrowthPaused && (
                  <Input
                    type="text"
                    label="Pause Notice to User"
                    value={overridePausedReason}
                    onChange={(e) => setOverridePausedReason(e.target.value)}
                    hint="Notification message shown on the investor dashboard"
                  />
                )}
              </div>
            </div>
            <div className="flex gap-3 pt-5 mt-5 border-t border-border-subtle">
              <Button onClick={handleSaveOverrides} isLoading={savingOverrides} className="flex-1">
                Save Overrides
              </Button>
              <Button variant="outline" onClick={() => setSelectedUserForOverride(null)}>
                Cancel
              </Button>
            </div>
          </Modal>

          {/* DETAILS MODAL */}
          <Modal open={!!selectedUserForDetails} onClose={() => setSelectedUserForDetails(null)} title="Investor Account Profile" description="Full profile data and validation credentials" size="lg">
            {selectedUserForDetails && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Full Name</span>
                    <p className="font-semibold text-text-primary mt-0.5">{selectedUserForDetails.profile?.fullName || "Not Provided"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Username</span>
                    <p className="font-mono text-text-primary mt-0.5">{selectedUserForDetails.username}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Email Address</span>
                    <p className="text-text-primary mt-0.5">{selectedUserForDetails.email}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">System Role</span>
                    <p className="mt-0.5">
                      <Badge variant={selectedUserForDetails.role?.name === "ADMIN" ? "info" : "neutral"}>{selectedUserForDetails.role?.name || "USER"}</Badge>
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Registered Date</span>
                    <p className="text-text-primary mt-0.5">{new Date(selectedUserForDetails.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Social Security Number (SSN)</span>
                    <p className="font-mono text-text-primary mt-0.5">{selectedUserForDetails.profile?.ssn || "Not Provided"}</p>
                  </div>
                </div>

                <div className="border-t border-border-subtle pt-4 space-y-3">
                  <h4 className="text-xs font-semibold text-text-secondary">Identity Document Verification</h4>
                  <div className="bg-surface-1 border border-border-subtle rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-muted font-semibold">Document Type:</span>
                      <span className="text-text-primary font-semibold">{selectedUserForDetails.profile?.idDocumentType || "None Uploaded"}</span>
                    </div>
                    {selectedUserForDetails.profile?.idDocumentUrl ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-text-muted text-xs font-semibold">Uploaded File:</span>
                          <a href={selectedUserForDetails.profile.idDocumentUrl} target="_blank" rel="noreferrer" className="text-brand-400 hover:text-brand-300 text-xs font-semibold underline">
                            View Raw Document
                          </a>
                        </div>
                        {(selectedUserForDetails.profile.idDocumentUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || selectedUserForDetails.profile.idDocumentUrl.includes("cloudinary.com")) && (
                          <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface-0 flex justify-center max-h-48">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={selectedUserForDetails.profile.idDocumentUrl} alt="ID Document Upload" className="object-contain max-h-48 w-full" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted italic">No document image uploaded.</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-border-subtle pt-4 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex gap-2">
                    {selectedUserForDetails.verificationStatus !== "APPROVED" && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (confirm(`Are you sure you want to approve ${selectedUserForDetails.profile?.fullName || selectedUserForDetails.username}?`)) {
                            try {
                              const res = await fetch(`/api/users/${selectedUserForDetails.id}/approve`, { method: "POST" });
                              const json = await res.json();
                              if (json.success) {
                                setSelectedUserForDetails(null);
                                fetchUsers();
                              } else {
                                alert(json.error?.message || "Failed to approve user");
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                      >
                        Approve ID
                      </Button>
                    )}
                    {selectedUserForDetails.verificationStatus !== "REJECTED" && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={async () => {
                          const reason = prompt("Enter reason for rejection (optional):");
                          if (reason !== null) {
                            try {
                              const res = await fetch(`/api/users/${selectedUserForDetails.id}/reject`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ reason }),
                              });
                              const json = await res.json();
                              if (json.success) {
                                setSelectedUserForDetails(null);
                                fetchUsers();
                              } else {
                                alert(json.error?.message || "Failed to reject user");
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                      >
                        Reject ID
                      </Button>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelectedUserForDetails(null)}>
                    Close Details
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        </Card>
      )}

      {/* TAB 3: INVESTMENTS ENGINE */}
      {activeTab === "investments" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Active User Investments</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {loadingInvestments ? (
                <div className="text-center py-12 text-xs text-text-muted">Loading investments...</div>
              ) : investments.length === 0 ? (
                <EmptyState title="No investments found" />
              ) : (
                <TableContainer className="border-0 rounded-none">
                  <Table>
                    <Thead>
                      <tr>
                        <Th>Investor</Th>
                        <Th>Plan</Th>
                        <Th className="text-right">Invested</Th>
                        <Th className="text-right">Current Balance</Th>
                        <Th className="text-right">Actions</Th>
                      </tr>
                    </Thead>
                    <Tbody>
                      {investments.map((inv) => (
                        <Tr key={inv.id}>
                          <Td className="font-semibold text-text-primary">{investorName(inv)}</Td>
                          <Td>{planName(inv)}</Td>
                          <Td className="text-right font-bold text-text-primary">${inv.amount.toLocaleString()}</Td>
                          <Td className="text-right font-bold text-text-primary">${inv.balance.toLocaleString()}</Td>
                          <Td className="text-right">
                            <button
                              onClick={() => {
                                setSelectedInvestment(inv);
                                setAdjustmentError("");
                              }}
                              className="text-brand-400 hover:text-brand-300 flex items-center gap-1 ml-auto"
                            >
                              <Edit className="w-4 h-4" /> Adjust
                            </button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </CardBody>
          </Card>

          <div>
            {selectedInvestment ? (
              <Card>
                <CardBody className="space-y-4">
                  <h4 className="text-sm font-semibold text-text-secondary">Update Performance for {investorName(selectedInvestment)}</h4>
                  <p className="text-xs text-text-muted">
                    Current Balance: <strong className="text-text-primary">${selectedInvestment.balance.toLocaleString()}</strong>
                  </p>

                  {adjustmentError && <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-xl">{adjustmentError}</div>}

                  <Select label="Adjustment Type" value={adjustmentType} onChange={(e) => setAdjustmentType(e.target.value)}>
                    <option value="PROFIT">Profit</option>
                    <option value="LOSS">Loss</option>
                    <option value="BONUS">Bonus</option>
                    <option value="ADJUSTMENT">General Adjustment</option>
                  </Select>

                  <Input type="number" label="Amount ($)" placeholder="150" value={adjustmentAmount} onChange={(e) => setAdjustmentAmount(e.target.value)} />

                  <Textarea label="Admin Note" placeholder="Optional reason or market context" value={adjustmentNote} onChange={(e) => setAdjustmentNote(e.target.value)} rows={3} />

                  <Input type="datetime-local" label="Performance Date (Optional)" value={adjustmentDate} onChange={(e) => setAdjustmentDate(e.target.value)} />

                  <div className="bg-surface-1 border border-border-subtle rounded-2xl p-4">
                    <h5 className="text-xs font-semibold text-text-secondary mb-3">Recent Performance Updates</h5>
                    <div className="space-y-2">
                      {selectedInvestment.performanceRecords?.length ? (
                        selectedInvestment.performanceRecords.slice(0, 4).map((record) => (
                          <div key={record.id} className="flex items-center justify-between text-[11px] border-b border-border-subtle last:border-b-0 pb-2 last:pb-0">
                            <div className="flex flex-col">
                              <span className="text-text-secondary font-semibold">{record.type}</span>
                              <span className="text-[9px] text-text-muted">{new Date(record.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn("font-bold", record.amount >= 0 ? "text-profit" : "text-loss")}>
                                {record.amount >= 0 ? "+" : "-"}${Math.abs(record.amount).toLocaleString()}
                              </span>
                              <button
                                onClick={() => handleDeletePerformanceRecord(record.id, selectedInvestment.id)}
                                disabled={deletingRecordId === record.id}
                                className="text-danger hover:text-danger/80 text-[9px] font-bold uppercase tracking-wider disabled:opacity-50"
                              >
                                {deletingRecordId === record.id ? "..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-text-muted">No performance records yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button onClick={saveAdjustment} isLoading={savingAdjustment} className="flex-1">
                      Apply Update
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedInvestment(null)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardBody className="text-center text-xs text-text-muted py-12">Select an investment from the table to begin portfolio performance adjustments.</CardBody>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DEPOSITS */}
      {activeTab === "deposits" && (
        <Card>
          <CardHeader>
            <CardTitle>Deposit Inflow Queue</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {loadingDeposits ? (
              <div className="text-center py-12 text-xs text-text-muted">Loading deposits...</div>
            ) : deposits.length === 0 ? (
              <EmptyState title="No deposits found" />
            ) : (
              <TableContainer className="border-0 rounded-none">
                <Table>
                  <Thead>
                    <tr>
                      <Th>Deposit ID</Th>
                      <Th>Investor</Th>
                      <Th>Plan</Th>
                      <Th>Wallet</Th>
                      <Th>Date</Th>
                      <Th className="text-right">Amount</Th>
                      <Th className="text-right">Status</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </Thead>
                  <Tbody>
                    {deposits.map((d) => (
                      <Tr key={d.id}>
                        <Td className="font-semibold text-text-primary truncate max-w-[100px]">{d.id}</Td>
                        <Td>{d.user?.profile?.fullName || d.user?.username || d.user?.email || "Investor"}</Td>
                        <Td>{d.plan?.name}</Td>
                        <Td>{d.wallet?.name}</Td>
                        <Td>{new Date(d.createdAt).toLocaleDateString()}</Td>
                        <Td className="text-right font-bold text-text-primary">${d.amount.toLocaleString()}</Td>
                        <Td className="text-right">
                          <Badge variant={statusToVariant(d.status)}>{d.status}</Badge>
                        </Td>
                        <Td className="text-right">
                          {d.status === "PENDING" && (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setApprovingDeposit(d);
                                  setConfirmedDepositAmount(d.amount.toString());
                                  setUpdatePortfolioOverride(true);
                                  setApprovingDepositError("");
                                }}
                              >
                                Approve
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => handleRejectDeposit(d.id)}>
                                Reject
                              </Button>
                            </div>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </CardBody>
        </Card>
      )}

      {/* TAB 5: WITHDRAWALS */}
      {activeTab === "withdrawals" && (
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Outflow Queue</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {loadingWithdrawals ? (
              <div className="text-center py-12 text-xs text-text-muted">Loading withdrawals...</div>
            ) : withdrawals.length === 0 ? (
              <EmptyState title="No withdrawal requests found" />
            ) : (
              <TableContainer className="border-0 rounded-none">
                <Table>
                  <Thead>
                    <tr>
                      <Th>Withdrawal ID</Th>
                      <Th>Investor</Th>
                      <Th>Payout Details</Th>
                      <Th>Date</Th>
                      <Th className="text-right">Amount</Th>
                      <Th className="text-right">Status</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </Thead>
                  <Tbody>
                    {withdrawals.map((w) => {
                      const { method, details } = formatPayoutDetails(w.address);
                      return (
                        <Tr key={w.id}>
                          <Td className="font-semibold text-text-primary truncate max-w-[100px]">{w.id}</Td>
                          <Td>{w.user?.profile?.fullName || w.user?.username || w.user?.email || "Investor"}</Td>
                          <Td>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[9px] bg-surface-3 text-brand-400 font-extrabold uppercase shrink-0">{method}</span>
                              <span className="font-mono text-text-secondary truncate max-w-[160px]" title={details}>
                                {details}
                              </span>
                            </div>
                          </Td>
                          <Td>{new Date(w.createdAt).toLocaleDateString()}</Td>
                          <Td className="text-right font-bold text-text-primary">${w.amount.toLocaleString()}</Td>
                          <Td className="text-right">
                            <Badge variant={statusToVariant(w.status)}>{w.status}</Badge>
                          </Td>
                          <Td className="text-right">
                            {(w.status === "PROCESSING" || w.status === "PENDING") && (
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" onClick={() => handleApproveWithdrawal(w.id)}>
                                  Approve
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => handleRejectWithdrawal(w.id)}>
                                  Reject
                                </Button>
                              </div>
                            )}
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </CardBody>
        </Card>
      )}

      {/* TAB 6: WALLETS */}
      {activeTab === "wallets" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Funding Wallets</CardTitle>
              <CardDescription>Configure and manage dynamic cryptocurrency payment gateway targets</CardDescription>
            </div>
            {!showWalletForm && (
              <Button
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setWalletForm({ id: "", name: "", address: "", enabled: true });
                  setIsEditingWallet(false);
                  setWalletError("");
                  setShowWalletForm(true);
                }}
              >
                Add Funding Wallet
              </Button>
            )}
          </CardHeader>
          <CardBody>
            {showWalletForm ? (
              <form onSubmit={saveWallet} className="bg-surface-1 border border-border-subtle rounded-2xl p-6 space-y-4 max-w-xl">
                <h5 className="font-bold text-sm text-text-primary">{isEditingWallet ? "Edit Wallet Configuration" : "Add Funding Wallet"}</h5>
                {walletError && <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-xl">{walletError}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Wallet / Network Name" required placeholder="e.g. USDT (TRC-20)" value={walletForm.name} onChange={(e) => setWalletForm({ ...walletForm, name: e.target.value })} />
                  <Select label="Enabled Status" value={walletForm.enabled ? "true" : "false"} onChange={(e) => setWalletForm({ ...walletForm, enabled: e.target.value === "true" })}>
                    <option value="true">Active / Enabled</option>
                    <option value="false">Inactive / Disabled</option>
                  </Select>
                </div>

                <Input
                  label="Crypto Address"
                  required
                  placeholder="e.g. TYG3j8Z1pQWJt99fKLAkNsN7v4Yh8R3q2w"
                  value={walletForm.address}
                  onChange={(e) => setWalletForm({ ...walletForm, address: e.target.value })}
                  className="font-mono"
                />

                <div className="flex gap-3 pt-2">
                  <Button type="submit" isLoading={savingWallet}>
                    Save Wallet
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowWalletForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : loadingWallets ? (
              <div className="text-center text-xs text-text-muted py-12">Loading funding wallets...</div>
            ) : walletAddresses.length === 0 ? (
              <EmptyState title="No crypto funding wallets configured yet" description='Click "Add Funding Wallet" to create one.' />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {walletAddresses.map((w) => (
                  <Card key={w.id} className="p-6 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-bold text-sm text-text-primary">{w.name}</h5>
                        <button onClick={() => toggleWalletStatus(w.id, w.enabled)}>
                          <Badge variant={w.enabled ? "approved" : "rejected"}>{w.enabled ? "Enabled" : "Disabled"}</Badge>
                        </button>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] text-text-muted uppercase tracking-wider font-semibold">Wallet Address</label>
                        <input type="text" value={w.address} readOnly className="w-full bg-surface-0 border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-text-secondary font-mono" />
                      </div>
                    </div>

                    {w.qrCodeUrl && (
                      <div className="flex justify-center bg-surface-1 p-4 border border-border-subtle rounded-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={w.qrCodeUrl} alt={`${w.name} QR Code`} className="w-32 h-32 rounded-lg" />
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-border-subtle">
                      <button
                        onClick={() => {
                          setWalletForm({ id: w.id, name: w.name, address: w.address, enabled: w.enabled });
                          setIsEditingWallet(true);
                          setWalletError("");
                          setShowWalletForm(true);
                        }}
                        className="flex-1 bg-surface-2 hover:bg-surface-3 border border-border-subtle text-[10px] font-bold py-2 rounded-lg text-text-secondary transition-colors text-center"
                      >
                        Edit Details
                      </button>
                      <button onClick={() => deleteWallet(w.id)} className="flex-1 bg-danger/10 hover:bg-danger/15 border border-danger/20 text-[10px] font-bold py-2 rounded-lg text-danger transition-colors">
                        Remove
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* TAB 7: ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatTile label="Approved Deposits (8wk)" value={`$${(analytics?.totals.deposits ?? 0).toLocaleString()}`} icon={<TrendingUp className="w-4 h-4" />} tone="profit" />
            <StatTile label="Approved Withdrawals (8wk)" value={`$${(analytics?.totals.withdrawals ?? 0).toLocaleString()}`} icon={<TrendingDown className="w-4 h-4" />} tone="loss" />
            <StatTile
              label="Net Flow"
              value={`${(analytics?.totals.netFlow ?? 0) >= 0 ? "+" : "-"}$${Math.abs(analytics?.totals.netFlow ?? 0).toLocaleString()}`}
              icon={<DollarSign className="w-4 h-4" />}
              tone={(analytics?.totals.netFlow ?? 0) >= 0 ? "profit" : "loss"}
            />
            <StatTile label="New Investors (8wk)" value={(analytics?.totals.newUsers ?? 0).toLocaleString()} icon={<UsersIcon className="w-4 h-4" />} tone="brand" />
          </div>

          <ChartCard
            title="Deposits vs Withdrawals"
            description="Real approved fund movement, bucketed by week"
            height={380}
            isEmpty={!loadingAnalytics && (!analytics || analytics.weekly.every((w) => w.deposits === 0 && w.withdrawals === 0))}
            emptyLabel={loadingAnalytics ? "Loading analytics..." : "No approved deposits or withdrawals in this window yet"}
          >
            <AreaChart data={analytics?.weekly || []}>
              <defs>
                <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartTheme.seriesDeposits} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartTheme.seriesDeposits} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="weekLabel" stroke={chartTheme.axis} fontSize={10} />
              <YAxis stroke={chartTheme.axis} fontSize={10} />
              <Tooltip content={<ChartTooltip formatter={(v) => `$${v.toLocaleString()}`} />} cursor={{ stroke: chartTheme.grid }} />
              <Legend wrapperStyle={{ fontSize: 11, color: chartTheme.textSecondary }} />
              <Area type="monotone" dataKey="deposits" name="Deposits" stroke={chartTheme.seriesDeposits} fillOpacity={1} fill="url(#colorDeposits)" />
              <Line type="monotone" dataKey="withdrawals" name="Withdrawals" stroke={chartTheme.seriesWithdrawals} strokeWidth={2} dot={{ r: 3 }} />
            </AreaChart>
          </ChartCard>
        </div>
      )}

      {/* TAB 8: PLAN MANAGEMENT */}
      {activeTab === "plans" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Investment Plans</CardTitle>
              <CardDescription>Configure and manage active packages available to investors</CardDescription>
            </div>
            {!showPlanForm && (
              <Button
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setPlanForm(emptyPlanForm);
                  setIsEditingPlan(false);
                  setPlanError("");
                  setShowPlanForm(true);
                }}
              >
                Create New Plan
              </Button>
            )}
          </CardHeader>
          <CardBody>
            {showPlanForm ? (
              <form onSubmit={savePlan} className="bg-surface-1 border border-border-subtle rounded-2xl p-6 space-y-4 max-w-xl">
                <h5 className="font-bold text-sm text-text-primary">{isEditingPlan ? "Edit Investment Plan" : "Create Investment Plan"}</h5>
                {planError && <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-xl">{planError}</div>}

                <Input label="Plan Name" required placeholder="Starter Pack" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} />
                <Textarea
                  label="Description"
                  required
                  placeholder="Low risk investment package for beginners"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  rows={3}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input type="number" label="Minimum Amount ($)" required min="0" value={planForm.minAmount} onChange={(e) => setPlanForm({ ...planForm, minAmount: Number(e.target.value) })} />
                  <Input type="number" label="Maximum Amount ($)" required min="0" value={planForm.maxAmount} onChange={(e) => setPlanForm({ ...planForm, maxAmount: Number(e.target.value) })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Daily Compounding Rate (%)"
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    value={planForm.dailyGrowthRate}
                    onChange={(e) => setPlanForm({ ...planForm, dailyGrowthRate: Number(e.target.value) })}
                    hint="e.g. 0.3 = 0.3%/day"
                  />
                  <Input
                    type="number"
                    label="Duration (Months)"
                    required
                    min="1"
                    max="60"
                    value={planForm.durationMonths}
                    onChange={(e) => setPlanForm({ ...planForm, durationMonths: Number(e.target.value) })}
                    hint="Lock-up period before payout"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="planEnabled"
                      checked={planForm.enabled}
                      onChange={(e) => setPlanForm({ ...planForm, enabled: e.target.checked })}
                      className="rounded border-border-subtle bg-surface-0 text-brand-600 focus:ring-brand-500 focus:ring-offset-surface-0"
                    />
                    <label htmlFor="planEnabled" className="text-xs text-text-secondary font-semibold cursor-pointer">
                      Enable this plan immediately
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="planGrowthPaused"
                      checked={planForm.isGrowthPaused}
                      onChange={(e) => setPlanForm({ ...planForm, isGrowthPaused: e.target.checked })}
                      className="rounded border-border-subtle bg-surface-0 text-amber-500 focus:ring-amber-500 focus:ring-offset-surface-0"
                    />
                    <label htmlFor="planGrowthPaused" className="text-xs text-amber-300 font-semibold cursor-pointer">
                      Pause daily growth increment for this plan
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border-subtle">
                  <Button type="submit">{isEditingPlan ? "Save Changes" : "Create Plan"}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowPlanForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : loadingPlans ? (
              <div className="text-center py-12 text-xs text-text-muted">Loading plans...</div>
            ) : plans.length === 0 ? (
              <EmptyState title="No investment plans configured" description="Create one above." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.id} className={cn("p-6 flex flex-col justify-between", !plan.enabled && "opacity-60 border-dashed")}>
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <h5 className="font-bold text-sm text-text-primary">{plan.name}</h5>
                        <div className="flex items-center gap-1.5">
                          {plan.isGrowthPaused && <Badge variant="pending">Growth Paused</Badge>}
                          <Badge variant={plan.enabled ? "approved" : "rejected"}>{plan.enabled ? "Active" : "Inactive"}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted mb-4 line-clamp-2">{plan.description}</p>
                      <div className="bg-surface-0 rounded-xl p-3 border border-border-subtle mb-6 space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-text-muted">Min Investment:</span>
                          <span className="font-bold text-text-secondary">${plan.minAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-text-muted">Max Investment:</span>
                          <span className="font-bold text-text-secondary">${plan.maxAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-text-muted">Daily Rate:</span>
                          {plan.isGrowthPaused ? (
                            <span className="font-bold text-amber-400">Paused (0.00%/day)</span>
                          ) : (
                            <span className="font-bold text-profit">{(plan.dailyGrowthRate * 100).toFixed(2)}%/day</span>
                          )}
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-text-muted">Duration:</span>
                          <span className="font-bold text-text-secondary">{plan.durationMonths} months</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-border-subtle">
                      <button
                        onClick={() => {
                          setPlanForm({ ...plan, dailyGrowthRate: plan.dailyGrowthRate * 100 });
                          setIsEditingPlan(true);
                          setPlanError("");
                          setShowPlanForm(true);
                        }}
                        className="flex-1 bg-surface-2 hover:bg-surface-3 text-[10px] font-bold py-2 rounded-lg transition-colors text-brand-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => togglePlanGrowthPause(plan.id, plan.isGrowthPaused)}
                        className={cn("flex-1 text-[10px] font-bold py-2 rounded-lg transition-colors", plan.isGrowthPaused ? "bg-profit/10 hover:bg-profit/15 text-profit" : "bg-amber-500/10 hover:bg-amber-500/15 text-amber-400")}
                      >
                        {plan.isGrowthPaused ? "Resume" : "Pause"}
                      </button>
                      <button
                        onClick={() => togglePlanStatus(plan.id, plan.enabled)}
                        className={cn("flex-1 text-[10px] font-bold py-2 rounded-lg transition-colors", plan.enabled ? "bg-danger/10 hover:bg-danger/15 text-danger" : "bg-profit/10 hover:bg-profit/15 text-profit")}
                      >
                        {plan.enabled ? "Disable" : "Enable"}
                      </button>
                      <button onClick={() => deletePlan(plan.id)} className="bg-danger/10 hover:bg-danger/15 text-danger p-2 rounded-lg transition-colors">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* DEPOSIT APPROVAL MODAL */}
      <Modal
        open={!!approvingDeposit}
        onClose={() => setApprovingDeposit(null)}
        title="Approve Deposit Request"
        description={`Review and approve deposit for ${approvingDeposit?.user?.profile?.fullName || approvingDeposit?.user?.username || approvingDeposit?.user?.email || "Investor"}.`}
      >
        {approvingDepositError && <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-xl mb-4">{approvingDepositError}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">Original Requested Amount</label>
            <div className="text-sm font-bold text-text-secondary bg-surface-0 border border-border-subtle rounded-xl px-4 py-2.5">${approvingDeposit?.amount.toLocaleString()}</div>
          </div>

          <Input
            type="number"
            label="Confirmed Deposited Amount ($)"
            value={confirmedDepositAmount}
            onChange={(e) => setConfirmedDepositAmount(e.target.value)}
            placeholder={approvingDeposit?.amount.toString()}
          />

          <div className="flex items-center gap-3 bg-surface-1 border border-border-subtle p-3.5 rounded-xl">
            <input
              type="checkbox"
              id="updatePortfolioOverride"
              checked={updatePortfolioOverride}
              onChange={(e) => setUpdatePortfolioOverride(e.target.checked)}
              className="w-4 h-4 rounded border-border-subtle text-brand-600 focus:ring-brand-500 bg-surface-0"
            />
            <label htmlFor="updatePortfolioOverride" className="text-xs text-text-secondary font-medium select-none cursor-pointer">
              Manually update user&apos;s Portfolio Value override and total invested.
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-5 mt-5 border-t border-border-subtle">
          <Button onClick={handleApproveDepositSubmit} isLoading={submittingApproval} className="flex-1">
            Confirm &amp; Approve
          </Button>
          <Button variant="outline" onClick={() => setApprovingDeposit(null)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </AdminShell>
  );
}
