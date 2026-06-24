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
      className={`rounded-[14px] border border-[#ECEAE3] bg-white p-4 transition-colors ${
        onClick ? "active:bg-[#FCFBF8] cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
