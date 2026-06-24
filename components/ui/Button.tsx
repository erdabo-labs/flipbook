import { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

const VARIANTS = {
  primary: "bg-[#047857] text-white active:bg-[#03664A]",
  secondary: "bg-[#F4F2EC] text-[#1A1A17] active:bg-[#ECE9E1]",
  danger: "bg-red-600 text-white active:bg-red-700",
  ghost: "bg-transparent text-[#1A1A17] active:bg-[#F4F2EC]",
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
      className={`flex min-h-11 items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
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
      className={`flex min-h-11 items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-sm font-semibold transition-colors ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
