"use client";

import React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

type ButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type LinkProps = BaseProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-500 shadow-[0_8px_24px_-8px_rgba(79,70,229,0.55)] disabled:hover:bg-brand-600",
  secondary:
    "bg-surface-3 text-text-primary border border-border-strong hover:bg-surface-3/70 hover:border-brand-500/50",
  outline:
    "bg-transparent border border-border-strong text-text-secondary hover:border-brand-500/60 hover:text-text-primary",
  ghost: "bg-transparent text-text-secondary hover:bg-surface-2 hover:text-text-primary",
  danger: "bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-xs px-3 py-2 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-sm px-6 py-3.5 rounded-xl gap-2",
};

function classes(variant: Variant, size: Size, fullWidth: boolean | undefined, className: string | undefined) {
  return cn(
    "inline-flex items-center justify-center font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", isLoading, fullWidth, leftIcon, rightIcon, className, children, disabled, ...props },
    ref
  ) => (
    <button ref={ref} disabled={disabled || isLoading} className={classes(variant, size, fullWidth, className)} {...props}>
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
);
Button.displayName = "Button";

export function ButtonLink({ variant = "primary", size = "md", fullWidth, leftIcon, rightIcon, className, children, href, ...props }: LinkProps) {
  return (
    <Link href={href} className={classes(variant, size, fullWidth, className)} {...props}>
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}

export default Button;
