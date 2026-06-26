"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Briefcase,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Shield,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Edit,
  Plus,
  BarChart2,
  LogOut,
  Package,
  Menu,
  X
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

// Mock Data for Admin Panels
const analyticsData = [
  { name: "Week 1", deposits: 12000, withdrawals: 3000 },
  { name: "Week 2", deposits: 15400, withdrawals: 4500 },
  { name: "Week 3", deposits: 19800, withdrawals: 2000 },
  { name: "Week 4", deposits: 24500, withdrawals: 8000 },
  { name: "Week 5", deposits: 32000, withdrawals: 6000 },
  { name: "Week 6", deposits: 48500, withdrawals: 11000 },
];


interface InvestmentData {
  id: string;
  amount: number;
  balance: number;
  status: string;
  createdAt: string;
  user?: {
    username: string;
    email: string;
    profile?: {
      fullName: string;
    } | null;
  } | null;
  plan?: {
    name: string;
  } | null;
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
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "investments" | "deposits" | "withdrawals" | "wallets" | "analytics" | "plans">("overview");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Edit / Add Forms state
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
  const [walletForm, setWalletForm] = useState({
    id: "",
    name: "",
    address: "",
    enabled: true
  });
  const [walletError, setWalletError] = useState("");
  const [savingWallet, setSavingWallet] = useState(false);

  interface UserProfile {
    fullName: string | null;
    customPortfolioValue: number | null;
    customTotalInvestment: number | null;
    customTotalProfit: number | null;
    customWithdrawal: number | null;
    customAvailableCash: number | null;
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
    role?: {
      name: string;
    } | null;
    profile?: UserProfile | null;
  }
  // User Management State
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserForOverride, setSelectedUserForOverride] = useState<UserData | null>(null);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserData | null>(null);
  const [overridePortfolioValue, setOverridePortfolioValue] = useState("");
  const [overrideTotalInvestment, setOverrideTotalInvestment] = useState("");
  const [overrideTotalProfit, setOverrideTotalProfit] = useState("");
  const [overrideWithdrawal, setOverrideWithdrawal] = useState("");
  const [overrideAvailableCash, setOverrideAvailableCash] = useState("");
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
        body: JSON.stringify({
          amount: Number(creditAmount),
          planId: creditPlanId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCreditMessage({ text: `Successfully credited $${Number(creditAmount).toLocaleString()} to the user's account!`, type: "success" });
        setCreditAmount("");
        // Refresh all relevant tables
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
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenOverrideModal = (user: UserData) => {
    setSelectedUserForOverride(user);
    setOverridePortfolioValue(user.profile?.customPortfolioValue?.toString() || "");
    setOverrideTotalInvestment(user.profile?.customTotalInvestment?.toString() || "");
    setOverrideTotalProfit(user.profile?.customTotalProfit?.toString() || "");
    setOverrideWithdrawal(user.profile?.customWithdrawal?.toString() || "");
    setOverrideAvailableCash(user.profile?.customAvailableCash?.toString() || "");
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

  const [investments, setInvestments] = useState<InvestmentData[]>([]);
  const [loadingInvestments, setLoadingInvestments] = useState(false);

  const fetchInvestments = async () => {
    setLoadingInvestments(true);
    try {
      const res = await fetch("/api/investments?all=true");
      const data = await res.json();
      if (data.success) {
        setInvestments(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch investments", err);
    } finally {
      setLoadingInvestments(false);
    }
  };

  // Investment Plans state
  interface PlanData {
    id: string;
    name: string;
    description: string;
    minAmount: number;
    maxAmount: number;
    enabled: boolean;
  }
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [planForm, setPlanForm] = useState({
    id: "",
    name: "",
    description: "",
    minAmount: 0,
    maxAmount: 0,
    enabled: true
  });
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planError, setPlanError] = useState("");

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await fetch("/api/investment-plans?all=true");
      const data = await res.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch plans", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  // Deposits state
  interface DepositData {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    user?: {
      username: string;
      email: string;
      profile?: {
        fullName: string;
      } | null;
    } | null;
    plan?: {
      name: string;
    } | null;
    wallet?: {
      name: string;
    } | null;
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
    user?: {
      username: string;
      email: string;
      profile?: {
        fullName: string;
      } | null;
    } | null;
  }
  const [withdrawals, setWithdrawals] = useState<WithdrawalData[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  const fetchDeposits = async () => {
    setLoadingDeposits(true);
    try {
      const res = await fetch("/api/deposits");
      const data = await res.json();
      if (data.success) {
        setDeposits(data.data);
      }
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
      if (data.success) {
        setWithdrawals(data.data);
      }
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
      if (data.success) {
        setWalletAddresses(data.data);
      }
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
        body: JSON.stringify({
          confirmedAmount,
          updatePortfolioOverride
        })
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
      const res = await fetch(`/api/deposits/${id}/reject`, {
        method: "POST"
      });
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
      const res = await fetch(`/api/withdrawals/${id}/approve`, {
        method: "POST"
      });
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
      const res = await fetch(`/api/withdrawals/${id}/reject`, {
        method: "POST"
      });
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
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (response.ok) {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const toggleWalletStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/wallets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentStatus })
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
        body: JSON.stringify({
          name: walletForm.name,
          address: walletForm.address,
          enabled: walletForm.enabled
        })
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
      const res = await fetch(`/api/wallets/${id}`, {
        method: "DELETE"
      });
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
      const res = await fetch(`/api/investments/${investmentId}/performance?recordId=${recordId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        // Refresh investments
        fetchInvestments();
        // Update selectedInvestment records list
        if (selectedInvestment) {
          const updatedRecords = selectedInvestment.performanceRecords?.filter(r => r.id !== recordId) || [];
          const recordToDelete = selectedInvestment.performanceRecords?.find(r => r.id === recordId);
          const revertedBalance = recordToDelete ? selectedInvestment.balance - recordToDelete.amount : selectedInvestment.balance;
          setSelectedInvestment({
            ...selectedInvestment,
            balance: revertedBalance,
            performanceRecords: updatedRecords,
          });
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
          enabled: planForm.enabled
        })
      });
      
      const result = await res.json();
      if (result.success) {
        setShowPlanForm(false);
        setPlanForm({ id: "", name: "", description: "", minAmount: 0, maxAmount: 0, enabled: true });
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

  const deletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      const res = await fetch(`/api/investment-plans/${id}`, {
        method: "DELETE"
      });
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

  const togglePlanStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/investment-plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentStatus })
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

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-slate-900/40 border-r border-slate-900 p-6 shrink-0">
        <div className="space-y-8">
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="text-indigo-400 w-6 h-6" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Vestriq Admin
            </span>
          </Link>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${activeTab === "overview" ? "bg-indigo-600/10 text-indigo-300 border-indigo-500/20" : "border-transparent text-slate-400 hover:text-white"}`}
            >
              <BarChart2 className="w-5 h-5" /> Overview
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${activeTab === "users" ? "bg-indigo-600/10 text-indigo-300 border-indigo-500/20" : "border-transparent text-slate-400 hover:text-white"}`}
            >
              <Users className="w-5 h-5" /> User Management
            </button>
            <button
              onClick={() => setActiveTab("investments")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${activeTab === "investments" ? "bg-indigo-600/10 text-indigo-300 border-indigo-500/20" : "border-transparent text-slate-400 hover:text-white"}`}
            >
              <Briefcase className="w-5 h-5" /> Investments Engine
            </button>
            <button
              onClick={() => setActiveTab("plans")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${activeTab === "plans" ? "bg-indigo-600/10 text-indigo-300 border-indigo-500/20" : "border-transparent text-slate-400 hover:text-white"}`}
            >
              <Package className="w-5 h-5" /> Plan Management
            </button>
            <button
              onClick={() => setActiveTab("deposits")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${activeTab === "deposits" ? "bg-indigo-600/10 text-indigo-300 border-indigo-500/20" : "border-transparent text-slate-400 hover:text-white"}`}
            >
              <ArrowDownLeft className="w-5 h-5" /> Deposits Funding
            </button>
            <button
              onClick={() => setActiveTab("withdrawals")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${activeTab === "withdrawals" ? "bg-indigo-600/10 text-indigo-300 border-indigo-500/20" : "border-transparent text-slate-400 hover:text-white"}`}
            >
              <ArrowUpRight className="w-5 h-5" /> Withdrawals Payouts
            </button>
            <button
              onClick={() => setActiveTab("wallets")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${activeTab === "wallets" ? "bg-indigo-600/10 text-indigo-300 border-indigo-500/20" : "border-transparent text-slate-400 hover:text-white"}`}
            >
              <Wallet className="w-5 h-5" /> Admin Wallets
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${activeTab === "analytics" ? "bg-indigo-600/10 text-indigo-300 border-indigo-500/20" : "border-transparent text-slate-400 hover:text-white"}`}
            >
              <TrendingUp className="w-5 h-5" /> System Analytics
            </button>
          </div>
        </div>

        <div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl text-sm font-semibold transition-all"
          >
            <LogOut className="w-5 h-5" /> Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* HEADER */}
        <header className="h-20 border-b border-slate-900 px-6 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-200 uppercase tracking-wider">Admin Control panel</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Global system configuration parameters</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-slate-900">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">System Manager</h4>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Administrator</span>
            </div>
          </div>
        </header>

        {/* WORKSPACE */}
        <div className="flex-1 p-6 md:p-8 space-y-8">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* TOP METRICS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-sm">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Assets Under Management</span>
                  <h3 className="text-2xl font-bold mt-2">$28.42M</h3>
                  <p className="text-[10px] text-slate-500 mt-2 font-semibold">Across active plans holdings</p>
                </div>
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-sm">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Active Users</span>
                  <h3 className="text-2xl font-bold mt-2">1,244 Users</h3>
                  <p className="text-[10px] text-slate-500 mt-2 font-semibold">+12% register rate this week</p>
                </div>
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-sm">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Pending Deposits</span>
                  <h3 className="text-2xl font-bold mt-2">{deposits.filter(d => d.status === "PENDING").length} Requests</h3>
                  <p className="text-[10px] text-yellow-400 mt-2 font-semibold">Verification queue alert</p>
                </div>
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 shadow-sm">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Pending Withdrawals</span>
                  <h3 className="text-2xl font-bold mt-2">{withdrawals.filter(w => w.status === "PROCESSING" || w.status === "PENDING").length} Requests</h3>
                  <p className="text-[10px] text-yellow-400 mt-2 font-semibold">Payout queue alert</p>
                </div>
              </div>

              {/* QUICK QUEUE SUMMARY */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm">
                  <h4 className="text-sm font-semibold mb-4 text-slate-300">Pending Deposit Funding Requests</h4>
                  <div className="space-y-4">
                    {loadingDeposits ? (
                      <div className="text-xs text-slate-400">Loading pending requests...</div>
                    ) : deposits.filter(d => d.status === "PENDING").length === 0 ? (
                      <div className="text-xs text-slate-550">No pending deposits in queue.</div>
                    ) : (
                      deposits.filter(d => d.status === "PENDING").map((d, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-950/40 p-4 border border-slate-900 rounded-2xl">
                          <div>
                            <h5 className="font-bold text-xs">{d.user?.profile?.fullName || d.user?.username || d.user?.email || "Investor"}</h5>
                            <span className="text-[10px] text-slate-500">{d.plan?.name} | {d.wallet?.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-sm text-emerald-400">+${d.amount.toLocaleString()}</span>
                            <button
                              onClick={() => {
                                setApprovingDeposit(d);
                                setConfirmedDepositAmount(d.amount.toString());
                                setUpdatePortfolioOverride(true);
                                setApprovingDepositError("");
                              }}
                              className="p-1.5 hover:bg-slate-900 rounded-lg text-emerald-400"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRejectDeposit(d.id)}
                              className="p-1.5 hover:bg-slate-900 rounded-lg text-red-400"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm">
                  <h4 className="text-sm font-semibold mb-4 text-slate-300">Pending Withdrawal Payout Requests</h4>
                  <div className="space-y-4">
                    {loadingWithdrawals ? (
                      <div className="text-xs text-slate-400">Loading payout requests...</div>
                    ) : withdrawals.filter(w => w.status === "PROCESSING" || w.status === "PENDING").length === 0 ? (
                      <div className="text-xs text-slate-550">No withdrawal payouts in queue.</div>
                    ) : (
                      withdrawals.filter(w => w.status === "PROCESSING" || w.status === "PENDING").map((w, i) => {
                        const { method, details } = formatPayoutDetails(w.address);
                        return (
                          <div key={i} className="flex justify-between items-center bg-slate-950/40 p-4 border border-slate-900 rounded-2xl">
                            <div>
                              <h5 className="font-bold text-xs">{w.user?.profile?.fullName || w.user?.username || w.user?.email || "Investor"}</h5>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-extrabold uppercase">{method}</span>
                                <span className="text-[10px] text-slate-450 truncate max-w-[150px] block font-mono">{details}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-sm text-red-400">-${w.amount.toLocaleString()}</span>
                              <button
                                onClick={() => handleApproveWithdrawal(w.id)}
                                className="p-1.5 hover:bg-slate-900 rounded-lg text-emerald-400"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm space-y-6">
              {/* Quick Manual Investment Credit Section */}
              <div className="bg-slate-900/45 border border-slate-900/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-900/60">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">Quick Manual Investment Credit</h3>
                    <p className="text-[10px] text-slate-500">Credit any investor account with a manual allocation</p>
                  </div>
                </div>

                <form onSubmit={handleManualCreditSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Select Investor</label>
                    <select
                      value={creditUserId}
                      onChange={(e) => setCreditUserId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    >
                      <option value="">-- Choose User --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.profile?.fullName || u.username} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Investment Plan</label>
                    <select
                      value={creditPlanId}
                      onChange={(e) => setCreditPlanId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    >
                      <option value="">-- Choose Plan --</option>
                      {plans.filter(p => p.enabled).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Min: ${p.minAmount.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Amount to Add ($)</label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white"
                      required
                      min="0.01"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={submittingCredit}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold py-2 rounded-xl transition-colors text-white cursor-pointer h-[34px] flex items-center justify-center gap-1.5"
                    >
                      {submittingCredit ? "Processing..." : "Credit Account"}
                    </button>
                  </div>
                </form>

                {creditMessage && (
                  <p className={`text-[10px] font-semibold ${creditMessage.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                    {creditMessage.text}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-6 border-b border-slate-900/60">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                  </select>
                </div>
              </div>

              {loadingUsers ? (
                <div className="text-center py-12 text-xs text-slate-400">Loading users...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="py-3">Name</th>
                        <th className="py-3">Username</th>
                        <th className="py-3">Email</th>
                        <th className="py-3">Role</th>
                        <th className="py-3">Joined</th>
                        <th className="py-3">Status</th>
                        <th className="py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter(u => {
                          const fullName = u.profile?.fullName || "";
                          const username = u.username || "";
                          const email = u.email || "";
                          const matchesQuery = fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                              username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                              email.toLowerCase().includes(searchQuery.toLowerCase());
                          return matchesQuery;
                        })
                        .map((u, i) => (
                          <tr key={i} className="border-b border-slate-900/60 hover:bg-slate-900/20">
                            <td className="py-4 font-semibold text-white">{u.profile?.fullName || "Investor"}</td>
                            <td className="py-4 font-mono">{u.username}</td>
                            <td className="py-4">{u.email}</td>
                            <td className="py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role?.name === "ADMIN" ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-500/10 text-slate-400"}`}>
                                {u.role?.name || "USER"}
                              </span>
                            </td>
                            <td className="py-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                             <td className="py-4">
                               <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                 u.verificationStatus === "APPROVED"
                                   ? "bg-emerald-500/10 text-emerald-400"
                                   : u.verificationStatus === "PENDING"
                                     ? "bg-yellow-500/10 text-yellow-400"
                                     : "bg-red-500/10 text-red-400"
                               }`}>
                                 {u.verificationStatus || "PENDING"}
                               </span>
                             </td>
                              <td className="py-4 text-right">
                               <div className="flex justify-end gap-3 items-center">
                                 <button
                                   onClick={() => setSelectedUserForDetails(u)}
                                   className="text-emerald-450 hover:text-emerald-400 font-semibold cursor-pointer"
                                 >
                                   View Details
                                 </button>
                                 <button
                                   onClick={() => handleOpenOverrideModal(u)}
                                   className="text-indigo-450 hover:text-indigo-400 font-semibold cursor-pointer"
                                 >
                                   Edit Stats
                                 </button>
                               </div>
                             </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* OVERRIDE MODAL */}
              {selectedUserForOverride && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">Edit Manual Stats Override</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Override statistics for <strong>{selectedUserForOverride.profile?.fullName || selectedUserForOverride.username}</strong>. Leave a field blank to clear the override and use calculated system values.
                      </p>
                    </div>

                    {overrideError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                        {overrideError}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Portfolio Value ($)</label>
                        <input
                          type="number"
                          placeholder="Calculated automatically"
                          value={overridePortfolioValue}
                          onChange={(e) => setOverridePortfolioValue(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Total Investment ($)</label>
                        <input
                          type="number"
                          placeholder="Calculated automatically"
                          value={overrideTotalInvestment}
                          onChange={(e) => setOverrideTotalInvestment(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Total Profit ($)</label>
                        <input
                          type="number"
                          placeholder="Calculated automatically"
                          value={overrideTotalProfit}
                          onChange={(e) => setOverrideTotalProfit(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Withdrawals ($)</label>
                        <input
                          type="number"
                          placeholder="Calculated automatically"
                          value={overrideWithdrawal}
                          onChange={(e) => setOverrideWithdrawal(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Available Cash ($)</label>
                        <input
                          type="number"
                          placeholder="Calculated automatically"
                          value={overrideAvailableCash}
                          onChange={(e) => setOverrideAvailableCash(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-800">
                      <button
                        onClick={handleSaveOverrides}
                        disabled={savingOverrides}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold py-3 rounded-xl transition-colors text-white disabled:opacity-50"
                      >
                        {savingOverrides ? "Saving..." : "Save Overrides"}
                      </button>
                      <button
                        onClick={() => setSelectedUserForOverride(null)}
                        className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold px-4 py-3 rounded-xl transition-colors text-slate-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

               {/* DETAILS MODAL */}
               {selectedUserForDetails && (
                 <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                   <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
                     <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                       <div>
                         <h3 className="text-lg font-bold text-slate-100">Investor Account Profile</h3>
                         <p className="text-xs text-slate-400 mt-1">Full profile data and validation credentials</p>
                       </div>
                       <button 
                         onClick={() => setSelectedUserForDetails(null)}
                         className="text-slate-400 hover:text-white transition-colors"
                       >
                         <X className="w-5 h-5" />
                       </button>
                     </div>
 
                     <div className="grid grid-cols-2 gap-4 text-xs">
                       <div>
                         <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Full Name</span>
                         <p className="font-semibold text-white mt-0.5">{selectedUserForDetails.profile?.fullName || "Not Provided"}</p>
                       </div>
                       <div>
                         <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Username</span>
                         <p className="font-mono text-white mt-0.5">{selectedUserForDetails.username}</p>
                       </div>
                       <div>
                         <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Email Address</span>
                         <p className="text-white mt-0.5">{selectedUserForDetails.email}</p>
                       </div>
                       <div>
                         <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">System Role</span>
                         <p className="text-white mt-0.5">
                           <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${selectedUserForDetails.role?.name === "ADMIN" ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-500/10 text-slate-400"}`}>
                             {selectedUserForDetails.role?.name || "USER"}
                           </span>
                         </p>
                       </div>
                       <div>
                         <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Registered Date</span>
                         <p className="text-white mt-0.5">{new Date(selectedUserForDetails.createdAt).toLocaleString()}</p>
                       </div>
                       <div>
                         <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Social Security Number (SSN)</span>
                         <p className="font-mono text-white mt-0.5">{selectedUserForDetails.profile?.ssn || "Not Provided"}</p>
                       </div>
                     </div>
 
                     <div className="border-t border-slate-800 pt-4 space-y-3">
                       <h4 className="text-xs font-semibold text-slate-300">Identity Document Verification</h4>
                       <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                         <div className="flex justify-between items-center text-xs">
                           <span className="text-slate-500 font-semibold">Document Type:</span>
                           <span className="text-white font-semibold">{selectedUserForDetails.profile?.idDocumentType || "None Uploaded"}</span>
                         </div>
                         {selectedUserForDetails.profile?.idDocumentUrl ? (
                           <div className="space-y-3">
                             <div className="flex items-center gap-2">
                               <span className="text-slate-500 text-xs font-semibold">Uploaded File:</span>
                               <a 
                                 href={selectedUserForDetails.profile.idDocumentUrl} 
                                 target="_blank" 
                                 rel="noreferrer" 
                                 className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold underline"
                               >
                                 View Raw Document
                               </a>
                             </div>
                             {/* Render image preview if it's likely an image */}
                             {selectedUserForDetails.profile.idDocumentUrl && 
                              (selectedUserForDetails.profile.idDocumentUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || 
                               selectedUserForDetails.profile.idDocumentUrl.includes("cloudinary.com")) && (
                               <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-900 flex justify-center max-h-48">
                                 <img 
                                   src={selectedUserForDetails.profile.idDocumentUrl} 
                                   alt="ID Document Upload" 
                                   className="object-contain max-h-48 w-full"
                                 />
                               </div>
                             )}
                           </div>
                         ) : (
                           <p className="text-xs text-slate-650 italic">No document image uploaded.</p>
                         )}
                       </div>
                     </div>
 
                     <div className="border-t border-slate-800 pt-4 flex justify-between items-center gap-3">
                        <div className="flex gap-2">
                          {selectedUserForDetails.verificationStatus !== "APPROVED" && (
                            <button
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
                              className="bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors text-white cursor-pointer"
                            >
                              Approve ID
                            </button>
                          )}
                          {selectedUserForDetails.verificationStatus !== "REJECTED" && (
                            <button
                              onClick={async () => {
                                const reason = prompt("Enter reason for rejection (optional):");
                                if (reason !== null) {
                                  try {
                                    const res = await fetch(`/api/users/${selectedUserForDetails.id}/reject`, {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ reason })
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
                              className="bg-red-650 hover:bg-red-650 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors text-white cursor-pointer"
                            >
                              Reject ID
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedUserForDetails(null)}
                          className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors text-slate-400 cursor-pointer"
                        >
                          Close Details
                        </button>
                      </div>
                   </div>
                 </div>
               )}
            </div>
          )}

          {/* TAB 3: INVESTMENTS ENGINE */}
          {activeTab === "investments" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm">
                <h4 className="text-sm font-semibold mb-4 text-slate-300">Active User Investments</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="py-3">Investor</th>
                        <th className="py-3">Plan</th>
                        <th className="py-3 text-right">Invested</th>
                        <th className="py-3 text-right">Current Balance</th>
                        <th className="py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingInvestments ? (
                        [...Array(3)].map((_, idx) => (
                          <tr key={idx} className="border-b border-slate-900/60 animate-pulse">
                            <td className="py-4"><div className="h-4 w-28 bg-slate-800 rounded" /></td>
                            <td className="py-4"><div className="h-4 w-20 bg-slate-800 rounded" /></td>
                            <td className="py-4 text-right"><div className="h-4 w-16 bg-slate-800 rounded ml-auto" /></td>
                            <td className="py-4 text-right"><div className="h-4 w-16 bg-slate-800 rounded ml-auto" /></td>
                            <td className="py-4 text-right"><div className="h-4 w-12 bg-slate-800 rounded ml-auto" /></td>
                          </tr>
                        ))
                      ) : investments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-xs text-slate-500">No investments found.</td>
                        </tr>
                      ) : (
                        investments.map((inv, i) => (
                          <tr key={i} className="border-b border-slate-900/60 hover:bg-slate-900/20">
                            <td className="py-4 font-semibold text-white">{investorName(inv)}</td>
                            <td className="py-4">{planName(inv)}</td>
                            <td className="py-4 text-right font-bold text-white">${inv.amount.toLocaleString()}</td>
                            <td className="py-4 text-right font-bold text-white">${inv.balance.toLocaleString()}</td>
                            <td className="py-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedInvestment(inv);
                                  setAdjustmentError("");
                                }}
                                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 ml-auto"
                              >
                                <Edit className="w-4 h-4" /> Adjust
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ADJUSTMENT PANEL */}
              <div>
                {selectedInvestment ? (
                  <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm space-y-4">
                    <h4 className="text-sm font-semibold text-slate-300">Update Performance for {investorName(selectedInvestment)}</h4>
                    <p className="text-xs text-slate-400">Current Balance: <strong>${selectedInvestment.balance.toLocaleString()}</strong></p>

                    {adjustmentError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                        {adjustmentError}
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Adjustment Type</label>
                      <select
                        value={adjustmentType}
                        onChange={(e) => setAdjustmentType(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                      >
                        <option value="PROFIT">Profit</option>
                        <option value="LOSS">Loss</option>
                        <option value="BONUS">Bonus</option>
                        <option value="ADJUSTMENT">General Adjustment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Amount ($)</label>
                      <input
                        type="number"
                        placeholder="150"
                        value={adjustmentAmount}
                        onChange={(e) => setAdjustmentAmount(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Admin Note</label>
                      <textarea
                        placeholder="Optional reason or market context"
                        value={adjustmentNote}
                        onChange={(e) => setAdjustmentNote(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Performance Date (Optional)</label>
                      <input
                        type="datetime-local"
                        value={adjustmentDate}
                        onChange={(e) => setAdjustmentDate(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-300"
                      />
                    </div>

                    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4">
                      <h5 className="text-xs font-semibold text-slate-300 mb-3">Recent Performance Updates</h5>
                      <div className="space-y-2">
                        {selectedInvestment.performanceRecords?.length ? (
                          selectedInvestment.performanceRecords.slice(0, 4).map((record) => (
                            <div key={record.id} className="flex items-center justify-between text-[11px] border-b border-slate-900/60 last:border-b-0 pb-2 last:pb-0">
                              <div className="flex flex-col">
                                <span className="text-slate-400 font-semibold">{record.type}</span>
                                <span className="text-[9px] text-slate-550">{new Date(record.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={record.amount >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                                  {record.amount >= 0 ? "+" : "-"}${Math.abs(record.amount).toLocaleString()}
                                </span>
                                <button
                                  onClick={() => handleDeletePerformanceRecord(record.id, selectedInvestment.id)}
                                  disabled={deletingRecordId === record.id}
                                  className="text-red-500 hover:text-red-400 text-[9px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                                >
                                  {deletingRecordId === record.id ? "..." : "Delete"}
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-slate-500">No performance records yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={saveAdjustment}
                        disabled={savingAdjustment}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {savingAdjustment ? "Applying..." : "Apply Update"}
                      </button>
                      <button
                        onClick={() => setSelectedInvestment(null)}
                        className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-semibold py-2.5 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm text-center text-xs text-slate-400 py-12">
                    Select an investment from the table to begin portfolio performance adjustments.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DEPOSITS */}
          {activeTab === "deposits" && (
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm space-y-6">
              <h4 className="text-sm font-semibold text-slate-300">Deposit Inflow Queue</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3">Deposit ID</th>
                      <th className="py-3">Investor</th>
                      <th className="py-3">Plan</th>
                      <th className="py-3">Wallet</th>
                      <th className="py-3">Date</th>
                      <th className="py-3 text-right">Amount</th>
                      <th className="py-3 text-right">Status</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingDeposits ? (
                      [...Array(3)].map((_, idx) => (
                        <tr key={idx} className="border-b border-slate-900/60 animate-pulse">
                          <td className="py-4"><div className="h-4 w-12 bg-slate-800 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-24 bg-slate-800 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-16 bg-slate-800 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-16 bg-slate-800 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-20 bg-slate-800 rounded" /></td>
                          <td className="py-4 text-right"><div className="h-4 w-16 bg-slate-800 rounded ml-auto" /></td>
                          <td className="py-4 text-right"><div className="h-4 w-16 bg-slate-800 rounded ml-auto" /></td>
                          <td className="py-4 text-right"><div className="h-4 w-20 bg-slate-800 rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : deposits.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-4 text-center text-xs text-slate-500">No deposits found.</td>
                      </tr>
                    ) : (
                      deposits.map((d, i) => (
                        <tr key={i} className="border-b border-slate-900/60 hover:bg-slate-900/20">
                          <td className="py-4 font-semibold text-white truncate max-w-[100px]">{d.id}</td>
                          <td className="py-4">{d.user?.profile?.fullName || d.user?.username || d.user?.email || "Investor"}</td>
                          <td className="py-4">{d.plan?.name}</td>
                          <td className="py-4">{d.wallet?.name}</td>
                          <td className="py-4">{new Date(d.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 text-right font-bold text-white">${d.amount.toLocaleString()}</td>
                          <td className="py-4 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" : d.status === "PENDING" ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            {d.status === "PENDING" && (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => {
                                    setApprovingDeposit(d);
                                    setConfirmedDepositAmount(d.amount.toString());
                                    setUpdatePortfolioOverride(true);
                                    setApprovingDepositError("");
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectDeposit(d.id)}
                                  className="bg-red-650 hover:bg-red-600 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: WITHDRAWALS */}
          {activeTab === "withdrawals" && (
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm space-y-6">
              <h4 className="text-sm font-semibold text-slate-300">Withdrawal Outflow Queue</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-3">Withdrawal ID</th>
                      <th className="py-3">Investor</th>
                      <th className="py-3 font-mono">Payout Details</th>
                      <th className="py-3">Date</th>
                      <th className="py-3 text-right">Amount</th>
                      <th className="py-3 text-right">Status</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingWithdrawals ? (
                      [...Array(3)].map((_, idx) => (
                        <tr key={idx} className="border-b border-slate-900/60 animate-pulse">
                          <td className="py-4"><div className="h-4 w-12 bg-slate-800 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-24 bg-slate-800 rounded" /></td>
                          <td className="py-4 font-mono"><div className="h-4 w-32 bg-slate-800 rounded" /></td>
                          <td className="py-4"><div className="h-4 w-20 bg-slate-800 rounded" /></td>
                          <td className="py-4 text-right"><div className="h-4 w-16 bg-slate-800 rounded ml-auto" /></td>
                          <td className="py-4 text-right"><div className="h-4 w-16 bg-slate-800 rounded ml-auto" /></td>
                          <td className="py-4 text-right"><div className="h-4 w-20 bg-slate-800 rounded ml-auto" /></td>
                        </tr>
                      ))
                    ) : withdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-xs text-slate-500">No withdrawal requests found.</td>
                      </tr>
                    ) : (
                      withdrawals.map((w, i) => (
                        <tr key={i} className="border-b border-slate-900/60 hover:bg-slate-900/20">
                          <td className="py-4 font-semibold text-white truncate max-w-[100px]">{w.id}</td>
                          <td className="py-4">{w.user?.profile?.fullName || w.user?.username || w.user?.email || "Investor"}</td>
                          <td className="py-4">
                            {(() => {
                              const { method, details } = formatPayoutDetails(w.address);
                              return (
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded text-[9px] bg-slate-850 text-indigo-400 font-extrabold uppercase shrink-0">
                                    {method}
                                  </span>
                                  <span className="font-mono text-slate-350 truncate max-w-[160px]" title={details}>
                                    {details}
                                  </span>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-4">{new Date(w.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 text-right font-bold text-white">${w.amount.toLocaleString()}</td>
                          <td className="py-4 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${w.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" : w.status === "PROCESSING" ? "bg-indigo-500/10 text-indigo-300" : w.status === "PENDING" ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>
                              {w.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            {(w.status === "PROCESSING" || w.status === "PENDING") && (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleApproveWithdrawal(w.id)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectWithdrawal(w.id)}
                                  className="bg-red-600 hover:bg-red-500 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: WALLETS */}
          {activeTab === "wallets" && (
            <div className="space-y-6">
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center pb-4 border-b border-slate-900/60 mb-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300">Funding Wallets</h4>
                    <p className="text-xs text-slate-500 mt-1">Configure and manage dynamic cryptocurrency payment gateway targets</p>
                  </div>
                  {!showWalletForm && (
                    <button
                      onClick={() => {
                        setWalletForm({ id: "", name: "", address: "", enabled: true });
                        setIsEditingWallet(false);
                        setWalletError("");
                        setShowWalletForm(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add Funding Wallet
                    </button>
                  )}
                </div>

                {showWalletForm ? (
                  <form onSubmit={saveWallet} className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 space-y-4 max-w-xl">
                    <h5 className="font-bold text-sm text-slate-200">{isEditingWallet ? "Edit Wallet Configuration" : "Add Funding Wallet"}</h5>
                    
                    {walletError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                        {walletError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Wallet / Network Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. USDT (TRC-20)"
                          value={walletForm.name}
                          onChange={(e) => setWalletForm({ ...walletForm, name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Enabled Status</label>
                        <select
                          value={walletForm.enabled ? "true" : "false"}
                          onChange={(e) => setWalletForm({ ...walletForm, enabled: e.target.value === "true" })}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white"
                        >
                          <option value="true">Active / Enabled</option>
                          <option value="false">Inactive / Disabled</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Crypto Address</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. TYG3j8Z1pQWJt99fKLAkNsN7v4Yh8R3q2w"
                        value={walletForm.address}
                        onChange={(e) => setWalletForm({ ...walletForm, address: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={savingWallet}
                        className="bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {savingWallet ? "Saving..." : "Save Wallet"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowWalletForm(false)}
                        className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {loadingWallets ? (
                      <div className="col-span-3 text-center text-xs text-slate-500 py-12">Loading funding wallets...</div>
                    ) : walletAddresses.length === 0 ? (
                      <div className="col-span-3 text-center text-xs text-slate-500 py-12">No crypto funding wallets configured yet. Click &quot;Add Funding Wallet&quot; to create one.</div>
                    ) : (
                      walletAddresses.map((w) => (
                        <div key={w.id} className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <h5 className="font-bold text-sm text-slate-200">{w.name}</h5>
                              <button
                                onClick={() => toggleWalletStatus(w.id, w.enabled)}
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all ${w.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
                              >
                                {w.enabled ? "Enabled" : "Disabled"}
                              </button>
                            </div>
                            <div className="space-y-3">
                              <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Wallet Address</label>
                              <input
                                type="text"
                                value={w.address}
                                readOnly
                                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-400 font-mono"
                              />
                            </div>
                          </div>

                          {w.qrCodeUrl && (
                            <div className="flex justify-center bg-slate-900/40 p-4 border border-slate-900/60 rounded-xl">
                              <img src={w.qrCodeUrl} alt={`${w.name} QR Code`} className="w-32 h-32 rounded-lg" />
                            </div>
                          )}

                          <div className="flex gap-2 pt-2 border-t border-slate-900/60">
                            <button
                              onClick={() => {
                                setWalletForm({ id: w.id, name: w.name, address: w.address, enabled: w.enabled });
                                setIsEditingWallet(true);
                                setWalletError("");
                                setShowWalletForm(true);
                              }}
                              className="flex-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold py-2 rounded-lg text-slate-300 transition-colors text-center"
                            >
                              Edit Details
                            </button>
                            <button
                              onClick={() => deleteWallet(w.id)}
                              className="flex-1 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-[10px] font-bold py-2 rounded-lg text-red-400 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm space-y-8">
              <h4 className="text-sm font-semibold text-slate-300">Deposits vs Withdrawals Volatility</h4>
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} />
                    <Line type="monotone" dataKey="deposits" stroke="#6366f1" strokeWidth={2} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="withdrawals" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 8: PLANS MANAGEMENT */}
          {activeTab === "plans" && (
            <div className="space-y-6">
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center pb-4 border-b border-slate-900/60 mb-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300">Investment Plans</h4>
                    <p className="text-xs text-slate-500 mt-1">Configure and manage active packages available to investors</p>
                  </div>
                  {!showPlanForm && (
                    <button
                      onClick={() => {
                        setPlanForm({ id: "", name: "", description: "", minAmount: 0, maxAmount: 0, enabled: true });
                        setIsEditingPlan(false);
                        setPlanError("");
                        setShowPlanForm(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Create New Plan
                    </button>
                  )}
                </div>

                {showPlanForm ? (
                  <form onSubmit={savePlan} className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 space-y-4 max-w-xl">
                    <h5 className="font-bold text-sm text-slate-200">{isEditingPlan ? "Edit Investment Plan" : "Create Investment Plan"}</h5>
                    
                    {planError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                        {planError}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Plan Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Starter Pack"
                        value={planForm.name}
                        onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Description</label>
                      <textarea
                        required
                        placeholder="Low risk investment package for beginners"
                        value={planForm.description}
                        onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Minimum Amount ($)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={planForm.minAmount}
                          onChange={(e) => setPlanForm({ ...planForm, minAmount: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Maximum Amount ($)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={planForm.maxAmount}
                          onChange={(e) => setPlanForm({ ...planForm, maxAmount: Number(e.target.value) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="planEnabled"
                        checked={planForm.enabled}
                        onChange={(e) => setPlanForm({ ...planForm, enabled: e.target.checked })}
                        className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950"
                      />
                      <label htmlFor="planEnabled" className="text-xs text-slate-300 font-semibold cursor-pointer">Enable this plan immediately</label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-900">
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors"
                      >
                        {isEditingPlan ? "Save Changes" : "Create Plan"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPlanForm(false)}
                        className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors text-slate-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : loadingPlans ? (
                  <div className="text-center py-12 text-xs text-slate-400">Loading plans...</div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">No investment plans configured. Create one above.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`bg-slate-950/40 border rounded-2xl p-6 flex flex-col justify-between hover:border-slate-800 transition-all ${!plan.enabled ? "opacity-60 border-dashed border-slate-800" : "border-slate-900"}`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-3">
                            <h5 className="font-bold text-sm text-slate-200">{plan.name}</h5>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                              {plan.enabled ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mb-4 line-clamp-2">{plan.description}</p>
                          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-900/60 mb-6 space-y-1.5">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-500">Min Investment:</span>
                              <span className="font-bold text-slate-300">${plan.minAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-500">Max Investment:</span>
                              <span className="font-bold text-slate-300">${plan.maxAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-slate-900/60">
                          <button
                            onClick={() => {
                              setPlanForm(plan);
                              setIsEditingPlan(true);
                              setPlanError("");
                              setShowPlanForm(true);
                            }}
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-[10px] font-bold py-2 rounded-lg transition-colors text-indigo-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => togglePlanStatus(plan.id, plan.enabled)}
                            className={`flex-1 text-[10px] font-bold py-2 rounded-lg transition-colors ${plan.enabled ? "bg-red-500/10 hover:bg-red-500/20 text-red-400" : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"}`}
                          >
                            {plan.enabled ? "Disable" : "Enable"}
                          </button>
                          <button
                            onClick={() => deletePlan(plan.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DEPOSIT APPROVAL MODAL */}
          {approvingDeposit && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-left">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Approve Deposit Request</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Review and approve deposit for <strong>{approvingDeposit.user?.profile?.fullName || approvingDeposit.user?.username || approvingDeposit.user?.email || "Investor"}</strong>.
                  </p>
                </div>

                {approvingDepositError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                    {approvingDepositError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Original Requested Amount</label>
                    <div className="text-sm font-bold text-slate-300 bg-slate-950 border border-slate-800/40 rounded-xl px-4 py-2.5">
                      ${approvingDeposit.amount.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Confirmed Deposited Amount ($)</label>
                    <input
                      type="number"
                      value={confirmedDepositAmount}
                      onChange={(e) => setConfirmedDepositAmount(e.target.value)}
                      placeholder={approvingDeposit.amount.toString()}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-800/60 p-3.5 rounded-xl">
                    <input
                      type="checkbox"
                      id="updatePortfolioOverride"
                      checked={updatePortfolioOverride}
                      onChange={(e) => setUpdatePortfolioOverride(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                    />
                    <label htmlFor="updatePortfolioOverride" className="text-xs text-slate-300 font-medium select-none cursor-pointer">
                      Manually update user&apos;s Portfolio Value override and total invested.
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={handleApproveDepositSubmit}
                    disabled={submittingApproval}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold py-3 rounded-xl transition-colors text-white disabled:opacity-50"
                  >
                    {submittingApproval ? "Approving..." : "Confirm & Approve"}
                  </button>
                  <button
                    onClick={() => setApprovingDeposit(null)}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold px-4 py-3 rounded-xl transition-colors text-slate-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
      {/* MOBILE DRAWER */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md lg:hidden flex">
          <div className="w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between h-full">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <TrendingUp className="text-indigo-400 w-6 h-6" />
                  <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                    Vestriq Admin
                  </span>
                </Link>
                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {[
                  { id: "overview", name: "Overview", icon: <BarChart2 className="w-5 h-5" /> },
                  { id: "users", name: "User Management", icon: <Users className="w-5 h-5" /> },
                  { id: "investments", name: "Investments Engine", icon: <Briefcase className="w-5 h-5" /> },
                  { id: "plans", name: "Plan Management", icon: <Package className="w-5 h-5" /> },
                  { id: "deposits", name: "Deposits Funding", icon: <ArrowDownLeft className="w-5 h-5" /> },
                  { id: "withdrawals", name: "Withdrawals Payouts", icon: <ArrowUpRight className="w-5 h-5" /> },
                  { id: "wallets", name: "Admin Wallets", icon: <Wallet className="w-5 h-5" /> },
                  { id: "analytics", name: "System Analytics", icon: <TrendingUp className="w-5 h-5" /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as "overview" | "users" | "investments" | "deposits" | "withdrawals" | "wallets" | "analytics" | "plans");
                      setIsMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${activeTab === item.id ? "bg-indigo-600/10 text-indigo-300 border-indigo-500/20" : "border-transparent text-slate-400 hover:text-white"}`}
                  >
                    {item.icon} {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <button
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
