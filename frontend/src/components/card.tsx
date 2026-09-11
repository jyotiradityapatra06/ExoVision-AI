import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hudCorners?: boolean;
  glow?: "cyan" | "orange" | "purple" | "none";
};

export function Card({
  children,
  className = "",
  hudCorners,
  glow,
  ...props
}: CardProps) {
  void hudCorners;
  void glow;
  return (
    <div
      className={`border border-stone-200/80 bg-[#FAF9F5] text-stone-900 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
