import { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

const VARIANTS = {
  primary: "bg-zinc-900 text-white active:bg-zinc-700",
  secondary: "bg-zinc-100 text-zinc-900 active:bg-zinc-200",
  danger: "bg-red-600 text-white active:bg-red-700",
  ghost: "bg-transparent text-zinc-900 active:bg-zinc-100",
};

type Variant = keyof typeof VARIANTS;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
