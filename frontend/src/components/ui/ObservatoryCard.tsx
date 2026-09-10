import type { HTMLAttributes, ReactNode } from "react";

type ObservatoryCardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "section" | "aside" | "div";
  variant?: "flat" | "elevated" | "interactive" | "reticle";
  children: ReactNode;
};

export function ObservatoryCard({ as: Element = "article", variant = "elevated", className = "", children, ...props }: ObservatoryCardProps) {
  return (
    <Element className={`dso-card dso-card--${variant} ${className}`.trim()} {...props}>
      {variant === "reticle" && <span className="dso-card__reticle" aria-hidden="true" />}
      {children}
    </Element>
  );
}
