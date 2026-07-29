"use client";

import React, { useState } from "react";
import { Clock, ShieldAlert, LogOut, RefreshCw } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function VerificationPendingPage() {
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setLoadingLogout(false);
    }
  };

  const handleCheckStatus = () => {
    setChecking(true);
    window.location.reload();
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-lg relative z-10 shadow-elevated">
        <CardBody className="p-8 md:p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-pending/10 border border-pending/30 rounded-full flex items-center justify-center mx-auto text-pending animate-pulse">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <Badge variant="pending">Verification Pending</Badge>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-brand-400 via-brand-300 to-accent bg-clip-text text-transparent mt-4">
              Under Compliance Review
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
              Your ID document and SSN credentials are currently undergoing secure manual verification by the compliance team.
            </p>
          </div>

          <div className="bg-surface-1 border border-border-subtle rounded-2xl p-5 text-left text-xs space-y-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-text-primary">Security Safeguard</h4>
                <p className="text-text-muted mt-0.5">
                  To maintain portal compliance and protect investor funds, trading services remain locked until approval is granted.
                </p>
              </div>
            </div>
            <div className="border-t border-border-subtle pt-3 flex justify-between items-center text-text-muted">
              <span>Estimated review time:</span>
              <span className="font-semibold text-text-secondary">1 - 2 hours</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={handleCheckStatus} isLoading={checking} leftIcon={<RefreshCw className="w-4 h-4" />} className="flex-1">
              {checking ? "Checking..." : "Refresh Status"}
            </Button>
            <Button onClick={handleLogout} isLoading={loadingLogout} variant="outline" leftIcon={<LogOut className="w-4 h-4" />} className="flex-1">
              {loadingLogout ? "Logging out..." : "Log Out"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
