import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-medium transition-colors select-none " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 " +
      "focus-visible:ring-offset-paper active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 " +
      "rounded-[6px] cursor-pointer";

    const variantStyles = {
      primary:
        "bg-accent text-accent-ink font-medium hover:bg-accent/90 active:bg-accent/80",
      secondary:
        "bg-paper-3 text-ink border border-rule hover:bg-paper-2 active:bg-paper-3",
      outline:
        "bg-transparent text-ink border border-rule hover:bg-paper-2 active:bg-paper-3",
      ghost:
        "bg-transparent text-ink-2 hover:text-ink hover:bg-paper-2 active:bg-paper-3",
      danger:
        "bg-bad-soft text-bad border border-bad/40 hover:bg-bad-soft/80 active:bg-bad-soft/60",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5 font-medium",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" aria-hidden="true" />}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
