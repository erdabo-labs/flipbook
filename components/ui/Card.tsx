import { ReactNode } from "react";

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-zinc-200 bg-white p-4 shadow-sm ${
        onClick ? "active:bg-zinc-50 cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
