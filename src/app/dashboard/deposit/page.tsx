"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Copy, ChevronRight, AlertCircle, CheckCircle } from "lucide-react";
import { COMPANIES } from "@/lib/constants";
import { DashboardShell } from "@/components/common/DashboardShell";
import { PlanCard, type PlanCardData } from "@/components/common/PlanCard";
import { FileUploadDropzone } from "@/components/common/FileUploadDropzone";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";

interface PlanData extends PlanCardData {
  enabled: boolean;
}

interface WalletData {
  id: string;
  name: string;
  address: string;
  qrCodeUrl: string | null;
}

async function uploadDepositProof(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/uploads/deposit-proof", { method: "POST", body: formData });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || "Failed to upload proof of payment");
  }
  return json.data.url;
}

function StepCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardBody className="space-y-4">
        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center text-xs shrink-0">
            {step}
          </span>
          {title}
        </h3>
        {children}
      </CardBody>
    </Card>
  );
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
  const [selectedCompany, setSelectedCompany] = useState(COMPANIES[0]?.name || "");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [proofUrl, setProofUrl] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [plansRes, walletsRes] = await Promise.all([fetch("/api/investment-plans"), fetch("/api/wallets")]);
        const plansData = await plansRes.json();
        const walletsData = await walletsRes.json();

        if (plansData.success) {
          setPlans(plansData.data);
          if (targetPlanId) {
            setSelectedPlanId(targetPlanId);
          } else if (plansData.data.length > 0) {
            setSelectedPlanId(plansData.data[0].id);
          }
        }

        if (walletsData.success) {
          const filtered = walletsData.data.filter((w: WalletData) => w.name.toLowerCase().includes("bitcoin") || w.name.toLowerCase().includes("usdt"));
          setWallets(filtered);
          if (filtered.length > 0) setSelectedWalletId(filtered[0].id);
        }
      } catch (err) {
        console.error("Failed to load page data", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [targetPlanId]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
  const durationMonths = selectedPlan?.durationMonths ?? 3;

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
    if (!selectedCompany) {
      setErrorMsg("Please select a company to invest in.");
      return;
    }
    const numAmt = Number(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setErrorMsg("Please enter a valid positive deposit amount.");
      return;
    }
    if (numAmt < selectedPlan.minAmount || numAmt > selectedPlan.maxAmount) {
      setErrorMsg(`Amount must be between $${selectedPlan.minAmount.toLocaleString()} and $${selectedPlan.maxAmount.toLocaleString()} for the ${selectedPlan.name} plan.`);
      return;
    }

    setProofUrl("");
    setShowModal(true);
  };

  const handleConfirmPaid = async () => {
    if (!proofUrl) {
      setErrorMsg("Please upload proof of payment before confirming.");
      return;
    }
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
          companyName: selectedCompany,
          proofUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setIsSubmitted(true);
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

  return (
    <DashboardShell active="deposit" title="Deposit Funding" subtitle="Add cash value to initiate plan subscriptions">
      <div className="max-w-3xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Fund Investment Account</h2>
          <p className="text-sm text-text-muted mt-2">Follow the guided selection to execute a digital crypto deposit into your portfolio.</p>
        </div>

        {isSubmitted ? (
          <Card className="p-8 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-profit/10 border border-profit/20 text-profit flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2 mt-6">
              <h3 className="text-xl font-bold text-text-primary">Deposit Under Processing</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Your deposit notification and proof of payment have been logged successfully. The administrator will verify the payment against the
                selected network. This process usually concludes within 24 hours.
              </p>
            </div>
            <Button onClick={() => router.push("/dashboard")} fullWidth className="mt-6">
              Return to Dashboard
            </Button>
          </Card>
        ) : loading ? (
          <div className="text-center py-20 text-text-muted text-sm">Syncing payment details...</div>
        ) : (
          <form onSubmit={initiatePayment} className="space-y-6">
            {errorMsg && (
              <div className="p-4 bg-danger/10 border border-danger/20 text-danger text-xs rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <StepCard step={1} title="Select Investment Package">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plans.map((p) => (
                  <PlanCard
                    key={p.id}
                    plan={p}
                    selected={selectedPlanId === p.id}
                    onSelect={() => {
                      setSelectedPlanId(p.id);
                      setErrorMsg("");
                    }}
                    actionLabel="Select Plan"
                  />
                ))}
              </div>
            </StepCard>

            <StepCard step={2} title="Select Crypto Asset Wallet">
              {wallets.length === 0 ? (
                <div className="text-xs text-pending bg-pending/10 p-4 border border-pending/20 rounded-2xl">
                  No active admin wallets configured. Please contact support.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wallets.map((w) => (
                    <div
                      key={w.id}
                      onClick={() => setSelectedWalletId(w.id)}
                      className={cn(
                        "cursor-pointer border rounded-2xl p-4 transition-all duration-200 flex items-center justify-between",
                        selectedWalletId === w.id ? "bg-brand-600/10 border-brand-500 shadow-md" : "bg-surface-1 border-border-subtle hover:border-border-strong"
                      )}
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-text-primary">{w.name}</h4>
                        <span className="text-[9px] text-text-muted font-mono block break-all mt-1">{w.address}</span>
                      </div>
                      <ChevronRight className={cn("w-5 h-5 transition-transform shrink-0", selectedWalletId === w.id ? "text-brand-400 translate-x-1" : "text-text-muted")} />
                    </div>
                  ))}
                </div>
              )}
            </StepCard>

            <StepCard step={3} title="Select Target Company">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {COMPANIES.map((company) => (
                  <div
                    key={company.symbol}
                    onClick={() => {
                      setSelectedCompany(company.name);
                      setErrorMsg("");
                    }}
                    className={cn(
                      "cursor-pointer border rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between",
                      selectedCompany === company.name ? "bg-brand-600/10 border-brand-500 shadow-md" : "bg-surface-1 border-border-subtle hover:border-border-strong"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs text-text-primary font-mono">{company.symbol}</span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold", company.positive ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss")}>
                        {company.change}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-text-secondary mt-2 truncate">{company.name}</h4>
                  </div>
                ))}
              </div>
            </StepCard>

            <StepCard step={4} title="Enter Investment Amount">
              <div className="space-y-2 max-w-sm">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-semibold text-sm">$</span>
                  <input
                    type="number"
                    required
                    placeholder="299"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setErrorMsg("");
                    }}
                    className="w-full bg-surface-1 border border-border-subtle focus:border-brand-500 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-text-primary font-bold"
                  />
                </div>
                {selectedPlan && (
                  <p className="text-[11px] text-text-muted">
                    Amount must be between <strong className="text-text-secondary">${selectedPlan.minAmount.toLocaleString()}</strong> and{" "}
                    <strong className="text-text-secondary">${selectedPlan.maxAmount.toLocaleString()}</strong>.
                  </p>
                )}
              </div>
            </StepCard>

            <StepCard step={5} title="Investment Duration">
              <div className="p-4 bg-surface-1 border border-border-subtle rounded-2xl text-xs text-text-muted leading-relaxed">
                This package is configured with a fixed investment duration of <strong className="text-brand-400">{durationMonths} Months</strong>. Payouts
                and withdrawals cannot be requested until the duration ends.
              </div>
            </StepCard>

            <Button type="submit" fullWidth size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Proceed to Deposit Address
            </Button>
          </form>
        )}
      </div>

      {/* PAYMENT MODAL */}
      <Modal open={showModal && !!selectedWallet} onClose={() => setShowModal(false)} title="Send Payment Inflow" description="Please deposit to the address below manually, then upload proof of payment." size="lg">
        {selectedWallet && (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center p-6 bg-surface-0 rounded-3xl border border-border-subtle relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/5 to-accent/5 opacity-40 pointer-events-none" />
              <div className="w-52 h-52 bg-white rounded-2xl flex items-center justify-center relative overflow-hidden p-2 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedWallet.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(selectedWallet.address)}`}
                  alt={`${selectedWallet.name} QR Code`}
                  className="w-48 h-48 object-contain"
                />
              </div>
              <span className="text-xs text-brand-400 font-extrabold mt-4 uppercase tracking-widest">{selectedWallet.name} Network</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] text-text-muted uppercase tracking-wider font-semibold">Amount to Transfer</label>
                <div className="w-full bg-surface-1 border border-border-subtle rounded-xl px-4 py-3 text-sm font-bold text-profit">${Number(amount).toLocaleString()}</div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-text-muted uppercase tracking-wider font-semibold">Payment Address</label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 bg-surface-1 border border-border-subtle rounded-xl px-4 py-3 text-xs text-text-secondary font-mono break-all leading-relaxed select-all">
                    {selectedWallet.address}
                  </div>
                  <button onClick={handleCopy} className="bg-surface-1 hover:bg-surface-2 border border-border-subtle p-3.5 rounded-xl text-brand-400 hover:text-brand-300 transition-colors shrink-0">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copySuccess && <p className="text-[10px] text-profit font-semibold mt-1">Address copied to clipboard!</p>}
              </div>

              <FileUploadDropzone
                label="Proof of Payment"
                hint="Upload a screenshot or receipt of your transaction (JPG/PNG, up to 5MB)"
                value={proofUrl}
                onUpload={uploadDepositProof}
                onUploaded={setProofUrl}
              />
            </div>

            {errorMsg && <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs rounded-xl">{errorMsg}</div>}

            <div className="flex gap-3 pt-4 border-t border-border-subtle">
              <Button onClick={handleConfirmPaid} isLoading={submitting} disabled={!proofUrl} className="flex-1">
                I Have Paid
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}

export default function DepositPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-text-muted text-sm">Loading...</div>}>
      <DepositContent />
    </Suspense>
  );
}
