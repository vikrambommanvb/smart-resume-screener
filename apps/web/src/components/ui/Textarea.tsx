import * as React from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength?: number;
  showCharCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, maxLength, showCharCount = false, value, onChange, ...props }, ref) => {
    const [length, setLength] = React.useState<number>(() => {
      if (typeof value === "string") return value.length;
      return 0;
    });

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLength(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className="relative w-full">
        <textarea
          ref={ref}
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          className={cn(
            "flex min-h-[120px] w-full rounded-[6px] border border-rule bg-paper-2 p-3 text-sm text-ink placeholder:text-muted transition-colors leading-relaxed",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50 resize-y",
            className
          )}
          {...props}
        />
        {showCharCount && maxLength && (
          <div className="mt-1 text-right text-xs font-outlier text-muted select-none">
            <span className="tabular-nums">{length}</span> / {maxLength}
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

