import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface DialogContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  titleId: string;
  descId: string;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const titleId = React.useId();
  const descId = React.useId();

  const setIsOpen = React.useCallback(
    (val: boolean) => {
      if (!isControlled) {
        setInternalOpen(val);
      }
      onOpenChange?.(val);
    },
    [isControlled, onOpenChange]
  );

  return (
    <DialogContext.Provider value={{ isOpen, setIsOpen, titleId, descId }}>
      {children}
    </DialogContext.Provider>
  );
};

export interface DialogTriggerProps {
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}

export const DialogTrigger: React.FC<DialogTriggerProps> = ({ children }) => {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error("DialogTrigger must be used inside Dialog");

  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      children.props.onClick?.(e);
      ctx.setIsOpen(true);
    },
  });
};

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  withRegistrationMarks?: boolean;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, withRegistrationMarks: _withRegistrationMarks = true, children, ...props }, ref) => {
    const ctx = React.useContext(DialogContext);
    if (!ctx) throw new Error("DialogContent must be used inside Dialog");

    const contentRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
      if (!ctx.isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          ctx.setIsOpen(false);
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      // Focus first focusable element
      const timer = setTimeout(() => {
        contentRef.current?.querySelector<HTMLElement>("button, [tabindex='0']")?.focus();
      }, 50);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
        clearTimeout(timer);
      };
    }, [ctx]);

    if (!ctx.isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/75 transition-opacity"
          aria-hidden="true"
          onClick={() => ctx.setIsOpen(false)}
        />

        {/* Modal Dialog Body */}
        <div
          ref={(node) => {
            contentRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ctx.titleId}
          aria-describedby={ctx.descId}
          className={cn(
            "relative z-50 w-full max-w-lg rounded-[8px] border border-rule bg-paper-2 p-6 shadow-2xl text-ink animate-in fade-in-0 zoom-in-95",
            className
          )}
          {...props}
        >
          <button
            type="button"
            onClick={() => ctx.setIsOpen(false)}
            aria-label="Close dialog"
            className="absolute top-4 right-4 rounded-[4px] p-1 text-ink-2 hover:text-ink hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          {children}
        </div>
      </div>
    );
  }
);
DialogContent.displayName = "DialogContent";

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-left mb-4", className)} {...props} />
);

export const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    const ctx = React.useContext(DialogContext);
    return (
      <h2
        ref={ref}
        id={ctx?.titleId}
        className={cn("font-display text-lg font-medium leading-none tracking-tight text-ink", className)}
        {...props}
      />
    );
  }
);
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const ctx = React.useContext(DialogContext);
    return (
      <p ref={ref} id={ctx?.descId} className={cn("text-xs text-ink-2 leading-relaxed mt-1", className)} {...props} />
    );
  }
);
DialogDescription.displayName = "DialogDescription";

export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 pt-4 border-t border-rule", className)} {...props} />
);
