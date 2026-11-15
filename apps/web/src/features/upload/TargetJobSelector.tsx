import * as React from "react";
import { AlertCircle, ChevronDown, Check, Search } from "lucide-react";
import { fetchPredefinedRoles } from "../../lib/api-client";
import { RoleProfile } from "../../types/api";
import { STATIC_ROLES } from "../../data/roles";
import { cn } from "../../lib/utils";

interface TargetJobSelectorProps {
  mode: "role" | "custom";
  onModeChange: (mode: "role" | "custom") => void;
  selectedRoleId: string;
  onRoleSelect: (roleId: string) => void;
  customJd: string;
  onCustomJdChange: (text: string) => void;
  disabled?: boolean;
}

export const TargetJobSelector: React.FC<TargetJobSelectorProps> = ({
  mode,
  onModeChange,
  selectedRoleId,
  onRoleSelect,
  customJd,
  onCustomJdChange,
  disabled = false,
}) => {
  const [roles, setRoles] = React.useState<RoleProfile[]>(STATIC_ROLES);
  const [isLoadingRoles, setIsLoadingRoles] = React.useState(false);

  // Combobox state
  const [isComboboxOpen, setIsComboboxOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const comboboxRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Persist mode choice in sessionStorage
  React.useEffect(() => {
    try {
      const savedMode = sessionStorage.getItem("srs_target_mode");
      if (savedMode === "role" || savedMode === "custom") {
        onModeChange(savedMode);
      }
    } catch {
      // ignore
    }
  }, [onModeChange]);

  const handleModeToggle = (nextMode: "role" | "custom") => {
    onModeChange(nextMode);
    try {
      sessionStorage.setItem("srs_target_mode", nextMode);
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    let mounted = true;
    setIsLoadingRoles(true);
    fetchPredefinedRoles()
      .then((data) => {
        if (!mounted) return;
        setRoles(data);
        if (data.length > 0 && !selectedRoleId) {
          onRoleSelect(data[0].id);
        }
      })
      .catch(() => {
        // Fallback silently
      })
      .finally(() => {
        if (mounted) setIsLoadingRoles(false);
      });

    return () => {
      mounted = false;
    };
  }, [onRoleSelect, selectedRoleId]);

  // Click outside to close combobox
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setIsComboboxOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-grow textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(140, textareaRef.current.scrollHeight)}px`;
    }
  }, [customJd]);

  const filteredRoles = React.useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const q = searchQuery.toLowerCase();
    return roles.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.core_skills.some((s) => s.toLowerCase().includes(q))
    );
  }, [roles, searchQuery]);

  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isComboboxOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsComboboxOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, filteredRoles.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredRoles.length) % Math.max(1, filteredRoles.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredRoles[highlightedIndex]) {
        onRoleSelect(filteredRoles[highlightedIndex].id);
        setIsComboboxOpen(false);
        setSearchQuery("");
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsComboboxOpen(false);
    }
  };

  const charCount = customJd.trim().length;

  return (
    <div className="space-y-5">
      {/* Segmented Control */}
      <div className="flex rounded-2xl bg-paper-3 p-1.5 border border-rule relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleModeToggle("role")}
          className={cn(
            "flex-1 rounded-xl py-3 px-4 text-sm font-semibold transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus press-scale",
            mode === "role"
              ? "bg-paper-2 text-ink border border-rule/80 shadow-sm"
              : "text-ink-2 hover:text-ink"
          )}
        >
          Curated tech role
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleModeToggle("custom")}
          className={cn(
            "flex-1 rounded-xl py-3 px-4 text-sm font-semibold transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus press-scale",
            mode === "custom"
              ? "bg-paper-2 text-ink border border-rule/80 shadow-sm"
              : "text-ink-2 hover:text-ink"
          )}
        >
          Custom job description
        </button>
      </div>

      {/* 1. Curated Tech Role Combobox */}
      {mode === "role" && (
        <div className="space-y-3" ref={comboboxRef}>
          <label className="block text-xs font-medium text-ink-2">
            Target role benchmark
          </label>

          {/* Trigger Button */}
          <div className="relative">
            <button
              type="button"
              id="role-select"
              disabled={disabled || isLoadingRoles}
              onClick={() => setIsComboboxOpen((prev) => !prev)}
              onKeyDown={handleKeyDown}
              aria-expanded={isComboboxOpen}
              aria-haspopup="listbox"
              className={cn(
                "w-full min-h-[50px] rounded-xl bg-paper-2 border border-rule px-4 py-3.5 text-left flex items-center justify-between text-base text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus transition-colors shadow-sm",
                isComboboxOpen && "border-accent ring-1 ring-accent"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-3">
                <span className="font-semibold truncate">
                  {isLoadingRoles ? "Loading predefined roles..." : activeRole ? activeRole.title : "Select role"}
                </span>
                {activeRole && (
                  <span className="text-xs text-muted font-normal hidden sm:inline">
                    ({activeRole.category || "Engineering"})
                  </span>
                )}
              </div>
              <ChevronDown className={cn("h-4 w-4 text-ink-2 transition-transform duration-200 shrink-0", isComboboxOpen && "rotate-180")} aria-hidden="true" />
            </button>

            {/* Dropdown Popover */}
            {isComboboxOpen && (
              <div
                role="listbox"
                className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-paper-2 p-3 border border-rule/80 space-y-1.5 max-h-84 overflow-y-auto shadow-lg shadow-black/30"
              >
                {/* Search Input */}
                <div className="relative mb-2">
                  <Search className="h-4 w-4 absolute left-3.5 top-3 text-muted pointer-events-none" aria-hidden="true" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedIndex(0);
                    }}
                    placeholder="Search roles or skills..."
                    className="w-full h-10 pl-9 pr-3 text-sm rounded-xl bg-paper-3 border border-rule text-ink placeholder:text-muted focus:outline-none focus:border-accent"
                    autoFocus
                  />
                </div>

                {filteredRoles.length === 0 ? (
                  <p className="text-sm text-muted text-center py-4">No matching roles found.</p>
                ) : (
                  filteredRoles.map((r, idx) => {
                    const isSelected = r.id === selectedRoleId;
                    const isHighlighted = idx === highlightedIndex;
                    return (
                      <div
                        key={r.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onRoleSelect(r.id);
                          setIsComboboxOpen(false);
                          setSearchQuery("");
                        }}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={cn(
                          "rounded-xl p-3 text-sm cursor-pointer transition-colors space-y-1.5",
                          isHighlighted ? "bg-paper-3 border border-rule-2" : "hover:bg-paper-3/70",
                          isSelected && "bg-paper-3 text-ink font-semibold"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-ink">{r.title}</span>
                          {isSelected && <Check className="h-4 w-4 text-accent" aria-hidden="true" />}
                        </div>
                        {r.summary && <p className="text-xs text-muted line-clamp-2 leading-relaxed">{r.summary}</p>}
                        {r.core_skills && r.core_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {r.core_skills.slice(0, 4).map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded text-xs bg-paper-2 text-muted border border-rule font-medium"
                              >
                                {s.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Active Role Preview Card */}
          {activeRole && (
            <div className="rounded-2xl bg-paper-3/40 p-5 space-y-3 text-sm border border-rule/80">
              <p className="text-ink-2 leading-relaxed font-normal">{activeRole.summary || activeRole.description}</p>
              {activeRole.core_skills && activeRole.core_skills.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-rule/50">
                  <span className="text-xs font-medium text-muted">Required benchmark skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeRole.core_skills.slice(0, 5).map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-paper-2 text-ink border border-rule"
                      >
                        {skill.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Custom Job Description Mode */}
      {mode === "custom" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="custom-jd-input" className="block text-xs font-medium text-ink-2">
              Paste target job posting
            </label>
            <span
              className={cn(
                "text-xs font-outlier tabular-nums font-medium",
                charCount < 250 ? "text-accent" : "text-muted"
              )}
            >
              {charCount} characters {charCount < 250 && "(min 250)"}
            </span>
          </div>

          <textarea
            id="custom-jd-input"
            ref={textareaRef}
            disabled={disabled}
            value={customJd}
            onChange={(e) => onCustomJdChange(e.target.value)}
            placeholder="Paste the full job requisition here, including responsibilities, required qualifications, and tech stack..."
            className="w-full min-h-[180px] rounded-2xl bg-paper-2 p-4 text-sm text-ink placeholder:text-muted border border-rule focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none transition-colors leading-relaxed shadow-sm"
          />

          {charCount > 0 && charCount < 50 && (
            <p className="text-xs text-accent flex items-center gap-1.5 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Please provide at least 50 characters from the job description.</span>
            </p>
          )}

          {charCount >= 50 && charCount < 250 && (
            <p className="text-xs text-accent flex items-center gap-1.5 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Paste at least 250 characters from the job posting for alignment analysis.</span>
            </p>
          )}

          {charCount >= 250 && charCount < 400 && (
            <p className="text-xs text-muted">
              Paste the complete requirements section for higher accuracy.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
