"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Uncaught runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Blurs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-danger/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg bg-surface-2/60 border border-border-subtle rounded-card p-8 md:p-12 backdrop-blur-xl shadow-elevated text-center space-y-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-danger/10 border border-danger/20 text-danger rounded-3xl animate-pulse">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">System Error Occurred</h1>
          <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
            An unexpected error occurred during execution. We have logged the trace and will review it shortly.
          </p>
        </div>

        {error.message && (
          <div className="p-4 bg-surface-1 border border-border-subtle rounded-2xl text-left font-mono text-[10px] text-danger/90 overflow-x-auto max-h-24 select-all">
            <span className="text-text-muted font-bold block mb-1">Error digest:</span>
            {error.message}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => reset()}
            className="flex-1 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-600/10"
          >
            <RotateCcw className="w-4 h-4" /> Try Recovering
          </button>
          <a
            href="/dashboard"
            className="flex-1 bg-surface-1 hover:bg-surface-2 border border-border-subtle text-text-secondary text-xs font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Home Terminal
          </a>
        </div>
      </div>
    </div>
  );
}
