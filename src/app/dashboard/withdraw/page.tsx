"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { DashboardShell } from "@/components/common/DashboardShell";
import { Card, CardBody } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Wallet, TrendingUp } from "lucide-react";

type PayoutMethod = "wallet" | "stripe" | "paypal";

export default function WithdrawalPage() {
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("wallet");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [lockedBalance, setLockedBalance] = useState(0);

  interface InvestmentInfo {
    id: string;
    amount: number;
    balance: number;
    status: string;
    createdAt: string;
    durationMonths: number;
    companyName?: string | null;
    plan?: { name: string };
  }
  const [investments, setInvestments] = useState<InvestmentInfo[]>([]);

  async function loadBalanceData() {
    try {
      const [invRes, wRes] = await Promise.all([fetch("/api/investments"), fetch("/api/withdrawals")]);
      const invData = await invRes.json();
      const wData = await wRes.json();

      let totalUnlocked = 0;
      let totalLocked = 0;
      let totalPending = 0;

      if (invData.success) {
        setInvestments(invData.data);
        invData.data.forEach((inv: { balance: number; createdAt: string; durationMonths: number; status: string }) => {
          if (inv.status !== "ACTIVE") return;
          const expiryDate = new Date(inv.createdAt);
          expiryDate.setMonth(expiryDate.getMonth() + (inv.durationMonths || 3));
          if (expiryDate <= new Date()) {
            totalUnlocked += inv.balance;
          } else {
            totalLocked += inv.balance;
          }
        });
      }

      if (wData.success) {
        totalPending = wData.data.filter((w: { status: string }) => w.status === "PENDING").reduce((sum: number, w: { amount: number }) => sum + w.amount, 0);
      }

      setWithdrawableBalance(Math.max(0, totalUnlocked - totalPending));
      setLockedBalance(totalLocked);
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
        body: JSON.stringify({ amount: numAmt, address: `[${payoutMethod.toUpperCase()}] ${address}` }),
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

  const addressLabel =
    payoutMethod === "wallet" ? "Destination Wallet Address (BTC, ETH, USDT)" : payoutMethod === "stripe" ? "Stripe Account Email / Card Details" : "PayPal Email Address";
  const addressHint =
    payoutMethod === "wallet"
      ? "Ensure the correct network fits the asset format before submitting."
      : payoutMethod === "stripe"
      ? "Your payout will be processed securely via Stripe Connect."
      : "Payout will be sent directly to your verified PayPal email address.";

  return (
    <DashboardShell active="withdraw" title="Withdrawal Portal" subtitle="Deduct and transfer asset gains externally">
      <div className="max-w-2xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Request Payout</h2>
          <p className="text-sm text-text-muted mt-2">Transfer verified portfolio values to your destination account.</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-text-muted text-sm">Syncing portfolio balance limits...</div>
        ) : (
          <form onSubmit={handleWithdrawalSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-4 bg-danger/10 border border-danger/20 text-danger text-xs rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-4 bg-profit/10 border border-profit/20 text-profit text-xs rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="bg-pending/5 border border-pending/15 rounded-card p-5 flex items-start gap-4">
              <Clock className="w-6 h-6 text-pending shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-pending uppercase tracking-wide">48-Hour Processing Notice</h4>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  To maintain strict security audits and prevent volatility leaks, all payout requests are reviewed manually by compliance officers.
                  Payments usually arrive at the designated destination within 48 hours of submission.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <StatTile label="Unlocked Balance" value={`$${withdrawableBalance.toLocaleString()}`} icon={<Wallet className="w-4 h-4" />} tone="profit" subtext="Available for payout" />
              <StatTile label="Locked Balance" value={`$${lockedBalance.toLocaleString()}`} icon={<TrendingUp className="w-4 h-4" />} tone="brand" subtext="Locked until plan matures" />
            </div>

            {investments.length > 0 && (
              <Card>
                <CardBody className="space-y-4">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Active Subscription Locking Details</h4>
                  <div className="space-y-3">
                    {investments.map((inv) => {
                      const expiryDate = new Date(inv.createdAt);
                      expiryDate.setMonth(expiryDate.getMonth() + (inv.durationMonths || 3));
                      const isExpired = expiryDate <= new Date();
                      return (
                        <div key={inv.id} className="flex justify-between items-center bg-surface-1 p-4 border border-border-subtle rounded-2xl text-xs gap-3">
                          <div className="min-w-0">
                            <h5 className="font-bold text-text-primary truncate">
                              {inv.plan?.name || "Standard Plan"} ({inv.companyName || "Diversified Index"}) &mdash; ${inv.amount.toLocaleString()}
                            </h5>
                            <p className="text-[10px] text-text-muted mt-1">
                              Duration: {inv.durationMonths || 3} Months | Subscribed: {new Date(inv.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={isExpired ? "active" : "info"} className="shrink-0">
                            {isExpired ? "Unlocked" : `Unlocks ${expiryDate.toLocaleDateString()}`}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            )}

            <Card>
              <CardBody className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[11px] text-text-muted uppercase tracking-wider font-semibold">Withdrawal Amount ($)</label>
                  <div className="relative max-w-sm">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-semibold text-sm">$</span>
                    <input
                      type="number"
                      required
                      placeholder="500"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setErrorMsg("");
                      }}
                      className="w-full bg-surface-1 border border-border-subtle focus:border-brand-500 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-text-primary font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[11px] text-text-muted uppercase tracking-wider font-semibold">Select Payout Method</label>
                  <Tabs
                    variant="pill"
                    activeId={payoutMethod}
                    onChange={(id) => {
                      setPayoutMethod(id as PayoutMethod);
                      setAddress("");
                    }}
                    items={[
                      { id: "wallet", label: "Crypto Wallet" },
                      { id: "stripe", label: "Stripe" },
                      { id: "paypal", label: "PayPal" },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] text-text-muted uppercase tracking-wider font-semibold">{addressLabel}</label>
                  <input
                    type={payoutMethod === "wallet" ? "text" : "email"}
                    required
                    placeholder={payoutMethod === "wallet" ? "e.g. TYG3j8Z1pQWJt99fKLAkNsN7v4Yh8R3q2w" : payoutMethod === "stripe" ? "e.g. stripe-account@company.com" : "e.g. paypal-email@domain.com"}
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setErrorMsg("");
                    }}
                    className="w-full bg-surface-1 border border-border-subtle focus:border-brand-500 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-text-primary font-mono"
                  />
                  <p className="text-[10px] text-text-muted">{addressHint}</p>
                </div>
              </CardBody>
            </Card>

            <Button type="submit" isLoading={submitting} disabled={withdrawableBalance <= 0} fullWidth size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Request Payout
            </Button>
          </form>
        )}
      </div>
    </DashboardShell>
  );
}
