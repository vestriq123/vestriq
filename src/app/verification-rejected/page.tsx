"use client";

import React, { useState } from "react";
import { ShieldAlert, LogOut } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function VerificationRejectedPage() {
  const [loadingLogout, setLoadingLogout] = useState(false);

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

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-danger/5 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-lg relative z-10 shadow-elevated">
        <CardBody className="p-8 md:p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-danger/10 border border-danger/30 rounded-full flex items-center justify-center mx-auto text-danger">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <Badge variant="rejected">Verification Rejected</Badge>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-danger via-brand-400 to-brand-300 bg-clip-text text-transparent mt-4">
              Verification Audits Failed
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
              Unfortunately, the uploaded identity documentation or profile credentials did not pass our secure verification protocol.
            </p>
          </div>

          <div className="bg-surface-1 border border-border-subtle rounded-2xl p-5 text-left text-xs space-y-3">
            <h4 className="font-semibold text-text-primary">What happened?</h4>
            <p className="text-text-muted leading-relaxed">
              The document uploaded may have been low quality, expired, not matching the registered name, or invalid.
            </p>
            <div className="border-t border-border-subtle pt-3 flex flex-col gap-1 text-text-muted">
              <span>To appeal or re-submit credentials:</span>
              <span className="font-semibold text-text-secondary">Please contact compliance support at support@vestriq.com.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={handleLogout} isLoading={loadingLogout} leftIcon={<LogOut className="w-4 h-4" />} className="flex-1">
              {loadingLogout ? "Logging out..." : "Log Out & Re-login"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
