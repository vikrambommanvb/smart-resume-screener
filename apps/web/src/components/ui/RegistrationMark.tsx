import React from "react";
import { cn } from "../../lib/utils";

interface RegistrationMarkProps {
  position?: "all" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}

export const RegistrationMark: React.FC<RegistrationMarkProps> = ({
  position = "all",
  className,
}) => {
  const tick = (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-ink-line/80 pointer-events-none select-none", className)}
      aria-hidden="true"
    >
      <line x1="5" y1="0" x2="5" y2="10" stroke="currentColor" strokeWidth="1" />
      <line x1="0" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );

  if (position !== "all") {
    return <div className="absolute">{tick}</div>;
  }

  return (
    <>
      <div className="absolute -top-1.5 -left-1.5">{tick}</div>
      <div className="absolute -top-1.5 -right-1.5">{tick}</div>
      <div className="absolute -bottom-1.5 -left-1.5">{tick}</div>
      <div className="absolute -bottom-1.5 -right-1.5">{tick}</div>
    </>
  );
};

