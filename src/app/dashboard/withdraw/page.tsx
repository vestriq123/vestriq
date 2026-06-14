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
  AlertCircle,
  Clock,
  CheckCircle2
} from "lucide-react";

export default function WithdrawalPage() {
  const router = useRouter();
  
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<"wallet" | "stripe" | "paypal">("wallet");
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  async function loadBalanceData() {
    try {
      const [invRes, wRes, sessionRes] = await Promise.all([
        fetch("/api/investments"),
        fetch("/api/withdrawals"),
        fetch("/api/auth/session")
      ]);
      
      const invData = await invRes.json();
      const wData = await wRes.json();
      const sessionData = await sessionRes.json();
      
      let totalBalance = 0;
      let totalPending = 0;
      
      if (invData.success) {
        totalBalance = invData.data.reduce((sum: number, inv: { balance: number }) => sum + inv.balance, 0);
      }
      
      if (wData.success) {
        totalPending = wData.data
          .filter((w: { status: string }) => w.status === "PENDING")
          .reduce((sum: number, w: { amount: number }) => sum + w.amount, 0);
      }
      
      setWithdrawableBalance(Math.max(0, totalBalance - totalPending));

      if (sessionData.authenticated && sessionData.user?.role === "ADMIN") {
        setIsAdmin(true);
      }
    } catch (err) {
      console.error("Failed to load withdrawal limits", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBalanceData();
  }, []);

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    const numAmt = Number(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setErrorMsg("Please enter a valid positive payout amount.");
      return;
    }
    
    if (numAmt > withdrawableBalance) {
      setErrorMsg(`Amount exceeds your maximum withdrawable balance of $${withdrawableBalance.toLocaleString()}.`);
      return;
    }
    
    if (address.trim().length < 5) {
      setErrorMsg("Please enter valid payout destination details.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmt, address: `[${payoutMethod.toUpperCase()}] ${address}` })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Withdrawal request initiated successfully! Processing will conclude within 48 hours.");
        setAmount("");
        setAddress("");
        loadBalanceData();
      } else {
        setErrorMsg(data.error?.message || "Failed to submit request.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected network error occurred.");
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
            <button
              onClick={() => router.push("/dashboard/deposit")}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-900/50 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-colors text-left"
            >
              <Wallet className="w-5 h-5" /> Deposit Funds
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600/10 text-indigo-300 rounded-xl text-sm font-semibold border border-indigo-500/20 text-left">
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
            <h1 className="text-lg font-bold text-slate-200">Withdrawal Portal</h1>
            <p className="text-xs text-slate-500 hidden sm:block">Deduct and transfer asset gains externally</p>
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
        <div className="flex-1 p-6 md:p-8 max-w-2xl space-y-8">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
              Request Payout
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Transfer verified portfolio values to your destination crypto wallet address.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-400 text-sm">
              Syncing portfolio balance limits...
            </div>
          ) : (
            <form onSubmit={handleWithdrawalSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* 48 HOUR NOTICE */}
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-3xl p-5 flex items-start gap-4 shadow-sm">
                <Clock className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">48-Hour Processing Notice</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    To maintain strict security audits and prevent volatility leaks, all payout requests are reviewed manually by compliance officers. Payments usually arrive at the designated wallet within 48 hours of submission.
                  </p>
                </div>
              </div>

              {/* WITHDRAWABLE METRIC */}
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm space-y-2">
                <span className="text-xs text-slate-550 uppercase tracking-wider font-semibold">Maximum Withdrawable Portfolio Balance</span>
                <h3 className="text-3xl font-extrabold text-white">${withdrawableBalance.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-550">Active investment valuation minus pending requests</p>
              </div>

              {/* INPUT FORM MODULE */}
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs text-slate-400 uppercase tracking-wider font-semibold">Withdrawal Amount ($)</label>
                  <div className="relative max-w-sm">
                    <span className="absolute left-4 top-3 text-slate-400 font-semibold text-sm">$</span>
                    <input
                      type="number"
                      required
                      placeholder="500"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setErrorMsg("");
                      }}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-8 pr-4 py-3 text-sm focus:outline-none text-white font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs text-slate-400 uppercase tracking-wider font-semibold">Select Payout Method</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => { setPayoutMethod("wallet"); setAddress(""); }}
                      className={`py-3 px-4 text-xs font-bold rounded-xl border transition-all ${payoutMethod === "wallet" ? "bg-indigo-600/10 text-indigo-300 border-indigo-500" : "bg-slate-950/40 border-slate-900 text-slate-400 hover:text-white"}`}
                    >
                      Crypto Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPayoutMethod("stripe"); setAddress(""); }}
                      className={`py-3 px-4 text-xs font-bold rounded-xl border transition-all ${payoutMethod === "stripe" ? "bg-indigo-600/10 text-indigo-300 border-indigo-500" : "bg-slate-950/40 border-slate-900 text-slate-400 hover:text-white"}`}
                    >
                      Stripe
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPayoutMethod("paypal"); setAddress(""); }}
                      className={`py-3 px-4 text-xs font-bold rounded-xl border transition-all ${payoutMethod === "paypal" ? "bg-indigo-600/10 text-indigo-300 border-indigo-500" : "bg-slate-950/40 border-slate-900 text-slate-400 hover:text-white"}`}
                    >
                      PayPal
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    {payoutMethod === "wallet" && "Destination Wallet Address (BTC, ETH, USDT)"}
                    {payoutMethod === "stripe" && "Stripe Account Email / Card Details"}
                    {payoutMethod === "paypal" && "PayPal Email Address"}
                  </label>
                  <input
                    type={payoutMethod === "wallet" ? "text" : "email"}
                    required
                    placeholder={
                      payoutMethod === "wallet"
                        ? "e.g. TYG3j8Z1pQWJt99fKLAkNsN7v4Yh8R3q2w"
                        : payoutMethod === "stripe"
                        ? "e.g. stripe-account@company.com"
                        : "e.g. paypal-email@domain.com"
                    }
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setErrorMsg("");
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3 text-xs focus:outline-none text-white font-mono"
                  />
                  <p className="text-[10px] text-slate-500">
                    {payoutMethod === "wallet" && "Ensure the correct network fits the asset format before submitting."}
                    {payoutMethod === "stripe" && "Your payout will be processed securely via Stripe Connect."}
                    {payoutMethod === "paypal" && "Payout will be sent directly to your verified PayPal email address."}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || withdrawableBalance <= 0}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
              >
                {submitting ? "Initiating Payout..." : "Request Payout"} <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
