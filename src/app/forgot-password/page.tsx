"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || result.error || "Recovery request failed");
      }
      setSuccessMessage(result.message || "A recovery link has been sent to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-2xl font-semibold mt-4 text-text-primary">Recover password</h1>
            <p className="text-sm text-text-muted mt-1">We&apos;ll send you link instructions to reset your password</p>
          </div>

          {error && <div className="bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl p-4 mb-6">{error}</div>}
          {successMessage && <div className="bg-profit/10 border border-profit/20 text-profit text-sm rounded-xl p-4 mb-6">{successMessage}</div>}

          {!successMessage && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input type="email" label="Email Address" required {...register("email")} error={errors.email?.message} placeholder="investor@example.com" />
              <Button type="submit" isLoading={loading} fullWidth size="lg">
                Send Link
              </Button>
            </form>
          )}

          <div className="text-center mt-8 text-sm text-text-muted">
            Remember your password?{" "}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
              Sign in
            </Link>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
