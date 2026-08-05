import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hudCorners?: boolean;
  glow?: "cyan" | "orange" | "purple" | "none";
};

export function Card({
  children,
  className = "",
  hudCorners = false,
  glow = "none",
  ...props
}: CardProps) {
  const glowStyles =
    glow === "cyan"
      ? "border-primary/50 shadow-[0_0_20px_rgba(0,218,243,0.2)]"
      : glow === "orange"
      ? "border-secondary/50 shadow-[0_0_20px_rgba(255,182,142,0.2)]"
      : glow === "purple"
      ? "border-ai-accent/50 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
      : "";

  return (
    <div
      className={`glass-panel hud-border ${hudCorners ? "corner-bracket-tl corner-bracket-br" : ""} ${glowStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
