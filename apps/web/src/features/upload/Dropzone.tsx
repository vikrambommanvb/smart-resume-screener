import * as React from "react";
import { AlertCircle, FileCheck, Upload, X } from "lucide-react";
import { formatBytes } from "../../lib/formatters";
import { cn } from "../../lib/utils";

interface DropzoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ file, onFileSelect, disabled = false }) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const validateAndSetFile = (selected: File) => {
    setErrorMsg(null);
    if (!selected.name.toLowerCase().endsWith(".pdf") && selected.type !== "application/pdf") {
      setErrorMsg("Please upload a PDF document (.pdf format only).");
      return;
    }
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
    if (selected.size > MAX_SIZE) {
      setErrorMsg(`File exceeds 5MB limit (${formatBytes(selected.size)}). Please choose a smaller PDF.`);
      return;
    }
    onFileSelect(selected);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // 1. File Selected State
  if (file) {
    return (
      <div className="relative rounded-2xl bg-paper-2 border border-rule/80 p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="rounded-xl bg-violet-soft p-3.5 text-violet border border-violet/30 shrink-0">
              <FileCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-base font-semibold text-ink truncate">{file.name}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                <span className="font-outlier tabular-nums text-ink-2 font-medium">{formatBytes(file.size)}</span>
                <span className="h-3 w-px bg-rule" aria-hidden="true" />
                <span className="text-violet font-medium">Ready for alignment scan</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-violet hover:text-ink underline underline-offset-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded px-2 py-1.5 min-h-[44px] flex items-center font-medium"
            >
              Change file
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onFileSelect(null)}
              aria-label="Remove selected resume"
              className="rounded-xl p-2.5 text-ink-2 hover:text-ink hover:bg-paper-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus cursor-pointer press-scale min-h-[44px] min-w-[44px] flex items-center justify-center border border-rule"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          disabled={disabled}
          onChange={handleFileChange}
          className="sr-only"
          tabIndex={-1}
        />
      </div>
    );
  }

  // 2. Idle & Drag-Over State
  return (
    <div className="space-y-3">
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) fileInputRef.current?.click();
          }
        }}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl p-8 sm:p-12 min-h-[240px] sm:min-h-[280px] text-center select-none cursor-pointer group transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-focus",
          isDragOver
            ? "border-2 border-solid border-accent bg-paper-3 shadow-lg"
            : "border-2 border-dashed border-rule bg-paper-2 hover:border-rule-2 hover:bg-paper-3",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          disabled={disabled}
          onChange={handleFileChange}
          className="sr-only"
        />

        <div className="rounded-full bg-paper-3 p-4 text-accent border border-rule mb-4 group-hover:scale-105 transition-transform press-scale shadow-sm">
          <Upload className="h-7 w-7" aria-hidden="true" />
        </div>

        <p className="font-display text-lg sm:text-xl font-medium text-ink mb-1.5">
          {isDragOver ? "Release to add resume" : "Drop your resume here, or browse"}
        </p>

        <p className="text-sm text-ink-2 max-w-md leading-relaxed mb-4">
          Upload an unencrypted PDF resume. Evaluated in-memory with zero disk storage.
        </p>

        <div className="flex items-center gap-2 text-xs text-muted bg-paper-3 px-3 py-1.5 rounded-full border border-rule">
          <span>PDF only</span>
          <span className="h-3 w-px bg-rule" aria-hidden="true" />
          <span>Up to 5 MB</span>
        </div>

        <span className="sr-only" aria-live="polite">
          {isDragOver ? "Release to add resume" : ""}
        </span>
      </label>

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center gap-2.5 p-3.5 text-xs text-bad bg-bad-soft border border-bad/40 rounded-[8px]"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
