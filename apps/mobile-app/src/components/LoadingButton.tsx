"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: ReactNode;
  loadingText?: string;
  icon?: ReactNode;
}

/**
 * LoadingButton - Premium button component with loading state
 * 
 * Features:
 * - Prevents double-click with disabled state during loading
 * - Shows spinner with optional loading text
 * - Maintains layout stability (no size jumps)
 * - Matches Uber/Cabify UX patterns
 */
export default function LoadingButton({
  loading = false,
  children,
  loadingText,
  icon,
  className = "",
  disabled,
  ...props
}: LoadingButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {icon}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
