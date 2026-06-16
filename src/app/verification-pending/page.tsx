"use client";

import React, { useState, useEffect } from "react";
import { Clock, ShieldAlert, LogOut, RefreshCw } from "lucide-react";

export default function VerificationPendingPage() {
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (response.ok) {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setLoadingLogout(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      // Reload page to re-trigger middleware validation
      window.location.reload();
    } catch (err) {
      console.error("Failed to check status", err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 text-center space-y-6">
        <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-2 text-yellow-500 animate-pulse">
          <Clock className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Verification Pending
          </span>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent mt-4">
            Under Compliance Review
          </h1>
          <p className="text-sm text-slate-350 leading-relaxed max-w-sm mx-auto">
            Your ID document and SSN credentials are currently undergoing secure manual verification by the compliance team.
          </p>
        </div>

        <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 text-left text-xs space-y-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-200">Security Safeguard</h4>
              <p className="text-slate-450 mt-0.5">To maintain portal compliance and protect investor funds, trading services remain locked until approval is granted.</p>
            </div>
          </div>
          <div className="border-t border-slate-850/60 pt-3 flex justify-between items-center text-slate-500">
            <span>Estimated review time:</span>
            <span className="font-semibold text-slate-300">1 - 2 hours</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking..." : "Refresh Status"}
          </button>
          
          <button
            onClick={handleLogout}
            disabled={loadingLogout}
            className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-white font-medium py-3 px-6 rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {loadingLogout ? "Logging out..." : "Log Out"}
          </button>
        </div>
      </div>
    </main>
  );
}
