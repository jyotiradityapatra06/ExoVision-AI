import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & { children: ReactNode };

export function Card({ children, className = "", ...props }: CardProps) {
  return <div className={`surface-card ${className}`} {...props}>{children}</div>;
}
