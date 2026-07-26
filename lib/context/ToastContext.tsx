"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { TOAST_TIMEOUT_MS } from "@/lib/config/toast";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface DiagnosticDetails {
  /** Request ID for tracking and support */
  requestId?: string;
  /** Error code for categorization */
  errorCode?: string;
  /** Timestamp when the error occurred */
  timestamp?: string;
}

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  action?: ToastAction;
  /** Auto-dismiss delay in ms. Pass 0 to require manual dismissal. Default uses config (5000). */
  duration?: number;
  /** Diagnostic details shown in disclosure (error variant only) */
  diagnostics?: DiagnosticDetails;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (options: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const toast = useCallback((options: Omit<Toast, "id">): string => {
    const id = `toast-${++counterRef.current}`;
    const duration = options.duration ?? (options.action ? 0 : TOAST_TIMEOUT_MS);
    setToasts((prev) => {
      const next = [...prev, { ...options, id, duration }];
      return next.length > 3 ? next.slice(-3) : next;
    });
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
