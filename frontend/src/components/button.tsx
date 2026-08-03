import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  href?: string;
  size?: "md" | "lg";
  variant?: "primary" | "secondary" | "ghost";
};

const styles = {
  primary: "bg-sky-300 text-slate-950 hover:bg-sky-200 shadow-lg shadow-sky-500/10",
  secondary: "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]",
  ghost: "text-slate-300 hover:bg-white/[0.05] hover:text-white",
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
  const classes = [
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50",
    size === "lg" ? "min-h-12 px-6 text-sm" : "min-h-10 px-4 text-sm",
    styles[variant],
    className,
  ].join(" ");

  if (href) {
    return <Link className={classes} href={href}>{children}</Link>;
  }

  return <button className={classes} type={type} {...props}>{children}</button>;
}
