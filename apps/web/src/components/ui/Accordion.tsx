import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

interface AccordionContextValue {
  openItems: Set<string>;
  toggleItem: (id: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
}

export const Accordion: React.FC<AccordionProps> = ({
  type = "single",
  defaultValue,
  className,
  children,
  ...props
}) => {
  const [openItems, setOpenItems] = React.useState<Set<string>>(() => {
    if (!defaultValue) return new Set();
    return new Set(Array.isArray(defaultValue) ? defaultValue : [defaultValue]);
  });

  const toggleItem = React.useCallback(
    (id: string) => {
      setOpenItems((prev) => {
        const next = new Set(type === "single" ? [] : prev);
        if (prev.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [type]
  );

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={cn("divide-y divide-rule rounded-[8px] border border-rule bg-paper-2", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const AccordionItemContext = React.createContext<{ value: string; isOpen: boolean }>({
  value: "",
  isOpen: false,
});

export const AccordionItem: React.FC<AccordionItemProps> = ({ value, className, children, ...props }) => {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error("AccordionItem must be inside Accordion");

  const isOpen = ctx.openItems.has(value);

  return (
    <AccordionItemContext.Provider value={{ value, isOpen }}>
      <div className={cn("overflow-hidden first:rounded-t-[12px] last:rounded-b-[12px]", className)} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
};

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const parentCtx = React.useContext(AccordionContext);
    const itemCtx = React.useContext(AccordionItemContext);

    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={itemCtx.isOpen}
        onClick={() => parentCtx?.toggleItem(itemCtx.value)}
        className={cn(
          "flex w-full items-center justify-between p-4 text-left text-sm font-medium text-ink transition-colors hover:bg-paper-3/40 select-none cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
          className
        )}
        {...props}
      >
        <span>{children}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-ink-2 transition-transform duration-200", itemCtx.isOpen && "rotate-180")}
          aria-hidden="true"
        />
      </button>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

export const AccordionContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const itemCtx = React.useContext(AccordionItemContext);

    if (!itemCtx.isOpen) return null;

    return (
      <div
        ref={ref}
        className={cn("p-4 pt-1 text-sm text-ink-2 leading-relaxed bg-paper-3/50 border-t border-rule", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AccordionContent.displayName = "AccordionContent";

