"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Upload, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, FileText, Eye, EyeOff } from "lucide-react";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username must contain only letters, numbers and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  idDocumentType: z.string().min(1, "Please select an ID type"),
  idDocumentUrl: z.string().min(1, "Please upload your ID document"),
  ssn: z.string().min(9, "Social Security Number must be at least 9 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      idDocumentType: "",
      idDocumentUrl: "",
      ssn: "",
    }
  });

  const selectedDocType = watch("idDocumentType");
  const docUrl = watch("idDocumentUrl");

  const handleProceedToStep2 = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    const isValid = await trigger(["fullName", "username", "email", "password"]);
    if (isValid) {
      setStep(2);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue("idDocumentUrl", reader.result as string, { shouldValidate: true });
        setUploadedFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || result.error || "Registration failed");
      }

      window.location.href = "/dashboard";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during registration.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            Vestriq
          </Link>
          <h1 className="text-2xl font-semibold mt-4">
            {step === 1 ? "Create your account" : "Identity Verification"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {step === 1 ? "Join high-yield investment structures today" : "Confirm your credentials to activate access"}
          </p>

          {/* Step Progress Indicators */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? "w-8 bg-indigo-500" : "w-4 bg-slate-800"}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? "w-8 bg-indigo-500" : "w-4 bg-slate-800"}`} />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-200 text-sm rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  {...register("fullName")}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="John Doe"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-400 mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Username
                </label>
                <input
                  type="text"
                  {...register("username")}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="johndoe_investor"
                />
                {errors.username && (
                  <p className="text-xs text-red-400 mt-1">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleProceedToStep2}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                Proceed to Verification <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Select ID Document Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue("idDocumentType", "DRIVERS_LICENSE", { shouldValidate: true })}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${selectedDocType === "DRIVERS_LICENSE" ? "bg-indigo-600/10 border-indigo-500 text-indigo-300" : "bg-slate-950/30 border-slate-800 text-slate-400 hover:border-slate-700"}`}
                  >
                    <ShieldCheck className="w-5 h-5 mb-2" />
                    <span className="text-xs font-semibold">Driver&apos;s License</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("idDocumentType", "STATE_ID", { shouldValidate: true })}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${selectedDocType === "STATE_ID" ? "bg-indigo-600/10 border-indigo-500 text-indigo-300" : "bg-slate-950/30 border-slate-800 text-slate-400 hover:border-slate-700"}`}
                  >
                    <FileText className="w-5 h-5 mb-2" />
                    <span className="text-xs font-semibold">State ID Card</span>
                  </button>
                </div>
                {errors.idDocumentType && (
                  <p className="text-xs text-red-400 mt-1">{errors.idDocumentType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Upload ID Document image
                </label>
                <div className="relative border border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/40 rounded-xl p-6 transition-colors flex flex-col items-center justify-center text-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {docUrl ? (
                    <div className="space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-200">{uploadedFileName || "document_uploaded.png"}</p>
                      <p className="text-[10px] text-slate-500">Click or drag new file to change</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-xs font-semibold text-slate-300">Click to upload file</p>
                      <p className="text-[10px] text-slate-500">Supports JPG, PNG or WebP</p>
                    </div>
                  )}
                </div>
                {errors.idDocumentUrl && (
                  <p className="text-xs text-red-400 mt-1">{errors.idDocumentUrl.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Social Security Number (SSN)
                </label>
                <input
                  type="text"
                  maxLength={11}
                  {...register("ssn")}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono tracking-widest"
                  placeholder="XXX-XX-XXXX"
                />
                {errors.ssn && (
                  <p className="text-xs text-red-400 mt-1">{errors.ssn.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Complete Registration"
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="text-center mt-8 text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
