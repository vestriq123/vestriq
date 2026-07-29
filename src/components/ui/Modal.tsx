"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({ open, onClose, title, description, size = "md", children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-surface-0/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full bg-surface-2 border border-border-strong rounded-card shadow-elevated max-h-[90vh] overflow-y-auto",
          sizeClasses[size]
        )}
      >
        {(title || description) && (
          <div className="px-6 py-5 border-b border-border-subtle flex items-start justify-between gap-4 sticky top-0 bg-surface-2 z-10">
            <div>
              {title && <h3 className="text-sm font-bold text-text-primary">{title}</h3>}
              {description && <p className="text-xs text-text-muted mt-1">{description}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="text-text-muted hover:text-text-primary transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-border-subtle bg-surface-2">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
