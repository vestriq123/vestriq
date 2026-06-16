"use client";

import React, { useState } from "react";
import { ShieldAlert, LogOut, ArrowRight } from "lucide-react";

export default function VerificationRejectedPage() {
  const [loadingLogout, setLoadingLogout] = useState(false);

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

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-2 text-red-550">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <span className="text-[10px] bg-red-500/20 text-red-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Verification Rejected
          </span>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-red-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mt-4">
            Verification Audits Failed
          </h1>
          <p className="text-sm text-slate-350 leading-relaxed max-w-sm mx-auto">
            Unfortunately, the uploaded identity documentation or profile credentials did not pass our secure verification protocol.
          </p>
        </div>

        <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 text-left text-xs space-y-3">
          <h4 className="font-semibold text-slate-200">What happened?</h4>
          <p className="text-slate-450 leading-relaxed">
            The document uploaded may have been low quality, expired, not matching the registered name, or invalid.
          </p>
          <div className="border-t border-slate-850/60 pt-3 flex flex-col gap-1 text-slate-450">
            <span>To appeal or re-submit credentials:</span>
            <span className="font-semibold text-slate-300">Please contact compliance support at support@vestriq.com.</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleLogout}
            disabled={loadingLogout}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {loadingLogout ? "Logging out..." : "Log Out & Re-login"}
          </button>
        </div>
      </div>
    </main>
  );
}
