"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, ArrowLeft, ShieldAlert } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg bg-surface-2/60 border border-border-subtle rounded-card p-8 md:p-12 backdrop-blur-xl shadow-elevated text-center space-y-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-3xl animate-bounce">
          <HelpCircle className="w-10 h-10" />
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-text-primary">404 Page Not Found</h1>
          <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
            The allocation route you are looking for has expired or does not exist. Check your URL parameters and try again.
          </p>
        </div>

        <div className="p-4 bg-surface-1 border border-border-subtle rounded-2xl flex items-center gap-3 text-left">
          <ShieldAlert className="w-5 h-5 text-brand-400 shrink-0" />
          <p className="text-[11px] text-text-muted leading-normal">
            If you believe this route is supposed to be active, please notify system support administrators.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 bg-surface-1 hover:bg-surface-2 border border-border-subtle text-text-secondary text-xs font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold py-3.5 rounded-2xl transition-all shadow-lg shadow-brand-600/10"
          >
            Return Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
