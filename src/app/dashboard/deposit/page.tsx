"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TrendingUp,
  Briefcase,
  Wallet,
  ArrowDownLeft,
  LogOut,
  User,
  ArrowRight,
  ShieldCheck,
  Copy,
  ChevronRight,
  AlertCircle,
  Menu,
  X
} from "lucide-react";

interface PlanData {
  id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  enabled: boolean;
}

interface WalletData {
  id: string;
  name: string;
  address: string;
  qrCodeUrl: string | null;
}

function DepositContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetPlanId = searchParams.get("planId");

  const [plans, setPlans] = useState<PlanData[]>([]);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [amount, setAmount] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [durationMonths, setDurationMonths] = useState(3);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [plansRes, walletsRes, sessionRes] = await Promise.all([
          fetch("/api/investment-plans"),
          fetch("/api/wallets"),
          fetch("/api/auth/session")
        ]);
        
        const plansData = await plansRes.json();
        const walletsData = await walletsRes.json();
        const sessionData = await sessionRes.json();
        
        if (plansData.success) {
          setPlans(plansData.data);
          if (targetPlanId) {
            setSelectedPlanId(targetPlanId);
          } else if (plansData.data.length > 0) {
            setSelectedPlanId(plansData.data[0].id);
          }
        }
        
        if (walletsData.success) {
          const filtered = walletsData.data.filter((w: WalletData) => 
            w.name.toLowerCase().includes("bitcoin") || w.name.toLowerCase().includes("usdt")
          );
          setWallets(filtered);
          if (filtered.length > 0) {
            setSelectedWalletId(filtered[0].id);
          }
        }

        if (sessionData.authenticated && sessionData.user?.role === "ADMIN") {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error("Failed to load page data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [targetPlanId]);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const selectedWallet = wallets.find(w => w.id === selectedWalletId);

  const handleCopy = () => {
    if (!selectedWallet) return;
    navigator.clipboard.writeText(selectedWallet.address);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const initiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!selectedPlan) {
      setErrorMsg("Please select an investment plan.");
      return;
    }
    
    if (!selectedWallet) {
      setErrorMsg("Please select a deposit payment wallet.");
      return;
    }
    
    const numAmt = Number(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setErrorMsg("Please enter a valid positive deposit amount.");
      return;
    }
    
    if (numAmt < selectedPlan.minAmount || numAmt > selectedPlan.maxAmount) {
      setErrorMsg(
        `Amount must be between $${selectedPlan.minAmount.toLocaleString()} and $${selectedPlan.maxAmount.toLocaleString()} for the ${selectedPlan.name} plan.`
      );
      return;
    }
    
    setShowModal(true);
  };

  const handleConfirmPaid = async () => {
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          walletId: selectedWalletId,
          amount: Number(amount),
          durationMonths: durationMonths
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        router.push("/dashboard");
      } else {
        setErrorMsg(data.error?.message || "Failed to submit deposit. Please check inputs.");
        setShowModal(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error occurred during payment submission.");
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

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
            <button
              onClick={() => router.push("/dashboard/plans")}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-900/50 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-colors text-left"
            >
              <ShieldCheck className="w-5 h-5" /> Investment Plans
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600/10 text-indigo-300 rounded-xl text-sm font-semibold border border-indigo-500/20 text-left">
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
                type="button"
                onClick={() => router.push("/admin")}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-650/10 text-indigo-400 hover:text-indigo-300 rounded-xl text-sm font-semibold transition-colors text-left"
              >
                <ShieldCheck className="w-5 h-5 text-indigo-400" /> Admin Control
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-200">Deposit Funding</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Add cash value to initiate plan subscriptions</p>
            </div>
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
        <div className="flex-1 p-6 md:p-8 max-w-3xl space-y-8">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
              Fund Investment Account
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Follow the guided selection to execute a digital crypto deposit into your portfolio.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-400 text-sm">
              Syncing payment details...
            </div>
          ) : (
            <form onSubmit={initiatePayment} className="space-y-6">
              {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. SELECT PLAN */}
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">1</span>
                  Select Investment Package
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {plans.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPlanId(p.id);
                        setErrorMsg("");
                      }}
                      className={`cursor-pointer border rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between ${selectedPlanId === p.id ? "bg-indigo-650/10 border-indigo-550 shadow-md shadow-indigo-600/5" : "bg-slate-950/40 border-slate-900 hover:border-slate-800"}`}
                    >
                      <div>
                        <h4 className="font-bold text-sm text-slate-200">{p.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-900 flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Investment Bounds</span>
                        <span className="text-xs font-semibold text-slate-300">${p.minAmount.toLocaleString()} - ${p.maxAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. SELECT WALLET */}
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">2</span>
                  Select Crypto Asset Wallet
                </h3>
                {wallets.length === 0 ? (
                  <div className="text-xs text-yellow-400 bg-yellow-500/10 p-4 border border-yellow-500/20 rounded-2xl">
                    No active admin wallets configured. Please contact support.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {wallets.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => setSelectedWalletId(w.id)}
                        className={`cursor-pointer border rounded-2xl p-4 transition-all duration-300 flex items-center justify-between ${selectedWalletId === w.id ? "bg-indigo-650/10 border-indigo-550 shadow-md" : "bg-slate-950/40 border-slate-900 hover:border-slate-800"}`}
                      >
                        <div>
                          <h4 className="font-bold text-xs text-slate-200">{w.name}</h4>
                          <span className="text-[9px] text-slate-500 font-mono block break-all mt-1">{w.address}</span>
                        </div>
                        <ChevronRight className={`w-5 h-5 transition-transform ${selectedWalletId === w.id ? "text-indigo-400 translate-x-1" : "text-slate-650"}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. ENTER AMOUNT */}
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">3</span>
                  Enter Investment Amount
                </h3>
                <div className="space-y-2 max-w-sm">
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-400 font-semibold text-sm">$</span>
                    <input
                      type="number"
                      required
                      placeholder="100"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setErrorMsg("");
                      }}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-8 pr-4 py-3 text-sm focus:outline-none text-white font-bold"
                    />
                  </div>
                  {selectedPlan && (
                    <p className="text-[11px] text-slate-500">
                      Amount must be between <strong>${selectedPlan.minAmount.toLocaleString()}</strong> and <strong>${selectedPlan.maxAmount.toLocaleString()}</strong>.
                    </p>
                  )}
                </div>
              </div>

              {/* 4. SELECT DURATION */}
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">4</span>
                  Select Investment Duration
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[3, 6, 9, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMonths(m)}
                      className={`py-3 px-4 text-xs font-bold rounded-xl border transition-all ${durationMonths === m ? "bg-indigo-650/10 text-indigo-300 border-indigo-550 shadow-md" : "bg-slate-950/40 border-slate-900 text-slate-400 hover:text-white"}`}
                    >
                      {m} Months
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-555 text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
              >
                Proceed to Deposit Address <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </main>

      {/* PAYMENT MODAL */}
      {showModal && selectedWallet && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-100">Send Payment Inflow</h3>
              <p className="text-xs text-slate-400 mt-1">Please deposit to the address below manually</p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="w-36 h-36 bg-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden">
                <img 
                  src={selectedWallet.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(selectedWallet.address)}`} 
                  alt={`${selectedWallet.name} QR Code`} 
                  className="w-32 h-32 object-contain rounded-lg"
                />
              </div>
              <span className="text-[10px] text-indigo-400 font-bold mt-3 uppercase tracking-wider">{selectedWallet.name} Network</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Amount to Transfer</label>
                <div className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm font-bold text-emerald-400">
                  ${Number(amount).toLocaleString()}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Payment Address</label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-400 font-mono break-all leading-relaxed select-all">
                    {selectedWallet.address}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-800 p-3.5 rounded-xl text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copySuccess && (
                  <p className="text-[10px] text-emerald-400 font-semibold mt-1">Address copied to clipboard!</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={handleConfirmPaid}
                disabled={submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold py-3.5 rounded-xl transition-colors text-white disabled:opacity-50"
              >
                {submitting ? "Submitting Request..." : "I Have Paid"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold px-4 py-3.5 rounded-xl transition-colors text-slate-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-900/50 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-colors text-left"
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
                  className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600/10 text-indigo-300 rounded-xl text-sm font-semibold border border-indigo-500/20 text-left"
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
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-650/10 text-indigo-400 hover:text-indigo-300 rounded-xl text-sm font-semibold transition-colors text-left"
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

export default function DepositPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>}>
      <DepositContent />
    </Suspense>
  );
}
