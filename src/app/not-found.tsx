"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, ArrowLeft, ShieldAlert } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg bg-slate-900/40 border border-slate-900/80 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl text-center space-y-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-3xl animate-bounce">
          <HelpCircle className="w-10 h-10" />
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            404 Page Not Found
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            The allocation route you are looking for has expired or does not exist. Check your URL parameters and try again.
          </p>
        </div>

        <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl flex items-center gap-3 text-left">
          <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0" />
          <p className="text-[11px] text-slate-500 leading-normal">
            If you believe this route is supposed to be active, please notify system support administrators.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/10"
          >
            Return Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
