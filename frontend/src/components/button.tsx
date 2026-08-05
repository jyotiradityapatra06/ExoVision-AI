import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  href?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "orange";
};

const styles = {
  primary:
    "bg-primary text-[#001f24] font-label-caps font-bold hover:bg-primary-fixed shadow-[0_0_20px_rgba(0,229,255,0.4)] border border-primary-fixed-dim/50",
  secondary:
    "border border-primary text-primary font-label-caps hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(0,229,255,0.2)] hud-glass backdrop-blur-md",
  orange:
    "bg-secondary text-[#331200] font-label-caps font-bold hover:bg-secondary-fixed shadow-[0_0_20px_rgba(255,182,142,0.4)] border border-secondary-fixed/50",
  ghost: "text-on-surface-variant hover:text-primary hover:bg-primary/10 font-label-caps",
};

export function Button({
  children,
  className = "",
  href,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  const sizeClasses =
    size === "lg"
      ? "min-h-12 px-8 py-3 text-xs tracking-wider uppercase"
      : size === "sm"
      ? "min-h-8 px-3 py-1 text-[11px] tracking-wider uppercase"
      : "min-h-10 px-5 py-2 text-xs tracking-wider uppercase";

  const classes = [
    "inline-flex items-center justify-center gap-2 rounded-DEFAULT font-mono transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-crosshair",
    sizeClasses,
    styles[variant],
    className,
  ].join(" ");

  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}
