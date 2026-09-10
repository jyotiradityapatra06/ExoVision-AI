import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrecisionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  shortcut?: string;
  href?: string;
  children: ReactNode;
};

export function PrecisionButton({
  variant = "primary",
  size = "md",
  loading = false,
  shortcut,
  disabled,
  className = "",
  href,
  children,
  ...props
}: PrecisionButtonProps) {
  const classes = `precision-button precision-button--${variant} precision-button--${size} ${className}`.trim();

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={classes}>
        <span>{children}</span>
        {shortcut && <kbd>{shortcut}</kbd>}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && <LoaderCircle className="precision-button__spinner" aria-hidden="true" />}
      <span>{children}</span>
      {shortcut && <kbd>{shortcut}</kbd>}
    </button>
  );
}
