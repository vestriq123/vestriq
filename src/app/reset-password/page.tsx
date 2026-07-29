"use client";

import React, { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setError("Token is missing. Cannot reset password.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || result.error || "Reset password failed");
      }
      setSuccess("Your password has been updated. Redirecting to login...");
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please request another recovery link.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <div className="bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl p-4 mb-6">
          Security Error: The recovery token is missing. Please follow the link in your email exactly.
        </div>
        <Link href="/forgot-password" className="text-brand-400 hover:underline text-sm">
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && <div className="bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl p-4 mb-6">{error}</div>}
      {success && <div className="bg-profit/10 border border-profit/20 text-profit text-sm rounded-xl p-4 mb-6">{success}</div>}

      {!success && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input type="password" label="New Password" required {...register("password")} error={errors.password?.message} placeholder="••••••••" />
          <Input
            type="password"
            label="Confirm Password"
            required
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
            placeholder="••••••••"
          />
          <Button type="submit" isLoading={loading} fullWidth size="lg">
            Reset Password
          </Button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 shadow-elevated">
        <CardBody className="p-8 md:p-10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight">
              <TrendingUp className="text-brand-400 w-6 h-6" />
              <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-accent bg-clip-text text-transparent">Vestriq</span>
            </Link>
            <h1 className="text-2xl font-semibold mt-4 text-text-primary">Reset Password</h1>
            <p className="text-sm text-text-muted mt-1">Enter your new secure account password</p>
          </div>

          <Suspense fallback={<div className="text-center text-sm text-text-muted py-4">Loading reset config...</div>}>
            <ResetPasswordFormContent />
          </Suspense>

          <div className="text-center mt-8 text-sm text-text-muted">
            Return to{" "}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
              Sign in
            </Link>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
