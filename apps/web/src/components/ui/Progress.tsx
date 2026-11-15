import * as React from "react";
import { cn } from "../../lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: "default" | "success" | "warning";
  showLabel?: boolean;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, variant = "default", showLabel = false, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

    const fillVariant = {
      default: "bg-accent",
      success: "bg-ok",
      warning: "bg-accent",
    };

    return (
      <div className="w-full space-y-1">
        {showLabel && (
          <div className="flex justify-between text-xs text-muted">
            <span>Progress</span>
            <span className="font-outlier tabular-nums">{percentage}%</span>
          </div>
        )}
        <div
          ref={ref}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`Progress: ${percentage}%`}
          className={cn(
            "relative h-2 w-full overflow-hidden rounded-full bg-paper-3 border border-rule",
            className
          )}
          {...props}
        >
          <div
            className={cn("h-full", fillVariant[variant])}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);
Progress.displayName = "Progress";
