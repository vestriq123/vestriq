"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, FileText, Eye, EyeOff, TrendingUp } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FileUploadDropzone } from "@/components/common/FileUploadDropzone";
import { cn } from "@/lib/cn";

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

async function uploadKycDocument(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/uploads/kyc-document", { method: "POST", body: formData });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || "Failed to upload document");
  }
  return json.data.url;
}

function DecorativeBackground() {
  return (
    <>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
    </>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { idDocumentType: "", idDocumentUrl: "", ssn: "" },
  });

  const selectedDocType = watch("idDocumentType");
  const docUrl = watch("idDocumentUrl");

  const handleProceedToStep2 = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    const isValid = await trigger(["fullName", "username", "email", "password"]);
    if (isValid) setStep(2);
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
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <DecorativeBackground />
        <Card className="w-full max-w-md relative z-10 shadow-elevated">
          <CardBody className="p-8 md:p-10 text-center space-y-6">
            <div className="w-16 h-16 bg-profit/10 border border-profit/30 rounded-full flex items-center justify-center mx-auto text-profit">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-brand-400 via-brand-300 to-accent bg-clip-text text-transparent">
                Registration Successful!
              </h1>
              <p className="text-sm text-text-secondary mt-3 leading-relaxed">
                Welcome to the Vestriq wealth ecosystem. Your investor credentials have been securely stored.
              </p>
              <p className="text-xs text-text-muted mt-2 leading-relaxed">
                We have dispatched a confirmation email containing onboarding instructions. Please check your inbox.
              </p>
            </div>
            <ButtonLink href="/login" fullWidth>
              Sign In to Your Dashboard
            </ButtonLink>
          </CardBody>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <DecorativeBackground />
      <Card className="w-full max-w-md relative z-10 shadow-elevated">
        <CardBody className="p-8 md:p-10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight">
              <TrendingUp className="text-brand-400 w-6 h-6" />
              <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-accent bg-clip-text text-transparent">Vestriq</span>
            </Link>
            <h1 className="text-2xl font-semibold mt-4 text-text-primary">{step === 1 ? "Create your account" : "Identity Verification"}</h1>
            <p className="text-sm text-text-muted mt-1">
              {step === 1 ? "Join high-yield investment structures today" : "Confirm your credentials to activate access"}
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <div className={cn("h-1.5 rounded-full transition-all duration-300", step === 1 ? "w-8 bg-brand-500" : "w-4 bg-surface-3")} />
              <div className={cn("h-1.5 rounded-full transition-all duration-300", step === 2 ? "w-8 bg-brand-500" : "w-4 bg-surface-3")} />
            </div>
          </div>

          {error && <div className="bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl p-4 mb-6">{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {step === 1 ? (
              <div className="space-y-5">
                <Input label="Full Name" required {...register("fullName")} error={errors.fullName?.message} placeholder="John Doe" />
                <Input label="Username" required {...register("username")} error={errors.username?.message} placeholder="johndoe_investor" />
                <Input type="email" label="Email Address" required {...register("email")} error={errors.email?.message} placeholder="john@example.com" />

                <div>
                  <label className="block text-[11px] text-text-muted uppercase tracking-wider font-semibold mb-1.5">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      className="w-full bg-surface-1 border border-border-subtle rounded-xl pl-4 pr-10 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-danger mt-1.5">{errors.password.message}</p>}
                </div>

                <Button type="button" onClick={handleProceedToStep2} fullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Proceed to Verification
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] text-text-muted uppercase tracking-wider font-semibold mb-1.5">
                    Select ID Document Type <span className="text-danger">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setValue("idDocumentType", "DRIVERS_LICENSE", { shouldValidate: true })}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all",
                        selectedDocType === "DRIVERS_LICENSE" ? "bg-brand-600/10 border-brand-500 text-brand-300" : "bg-surface-1 border-border-subtle text-text-muted hover:border-border-strong"
                      )}
                    >
                      <ShieldCheck className="w-5 h-5 mb-2" />
                      <span className="text-xs font-semibold">Driver&apos;s License</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("idDocumentType", "STATE_ID", { shouldValidate: true })}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all",
                        selectedDocType === "STATE_ID" ? "bg-brand-600/10 border-brand-500 text-brand-300" : "bg-surface-1 border-border-subtle text-text-muted hover:border-border-strong"
                      )}
                    >
                      <FileText className="w-5 h-5 mb-2" />
                      <span className="text-xs font-semibold">State ID Card</span>
                    </button>
                  </div>
                  {errors.idDocumentType && <p className="text-xs text-danger mt-1.5">{errors.idDocumentType.message}</p>}
                </div>

                <FileUploadDropzone
                  label="Upload ID Document Image"
                  hint="JPG, PNG up to 5MB — securely stored via Cloudinary"
                  value={docUrl}
                  error={errors.idDocumentUrl?.message}
                  onUpload={uploadKycDocument}
                  onUploaded={(url) => setValue("idDocumentUrl", url, { shouldValidate: true })}
                />

                <Input
                  label="Social Security Number (SSN)"
                  required
                  maxLength={11}
                  {...register("ssn")}
                  error={errors.ssn?.message}
                  className="font-mono tracking-widest"
                  placeholder="XXX-XX-XXXX"
                />

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" isLoading={loading} className="flex-[2]">
                    Complete Registration
                  </Button>
                </div>
              </div>
            )}
          </form>

          <div className="text-center mt-8 text-sm text-text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
              Sign in
            </Link>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
