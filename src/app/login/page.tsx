"use client";

import React, { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || result.error || "Login failed");
      }
      const redirectTo = searchParams.get("redirectTo");
      window.location.href = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-2 relative z-10 shadow-elevated">
      <CardBody className="p-8 md:p-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight">
            <TrendingUp className="text-brand-400 w-6 h-6" />
            <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-accent bg-clip-text text-transparent">Vestriq</span>
          </Link>
          <h1 className="text-2xl font-semibold mt-4 text-text-primary">Welcome back</h1>
          <p className="text-sm text-text-muted mt-1">Intelligent wealth management at your fingertips</p>
        </div>

        {error && <div className="bg-danger/10 border border-danger/20 text-danger text-sm rounded-xl p-4 mb-6">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input label="Username or Email" required {...register("identifier")} error={errors.identifier?.message} placeholder="investor@vestriq.com" />

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] text-text-muted uppercase tracking-wider font-semibold">
                Password <span className="text-danger">*</span>
              </label>
              <Link href="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                Forgot password?
              </Link>
            </div>
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

          <Button type="submit" isLoading={loading} fullWidth size="lg">
            Sign In
          </Button>
        </form>

        <div className="text-center mt-8 text-sm text-text-muted">
          New to Vestriq?{" "}
          <Link href="/register" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
            Create an account
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
