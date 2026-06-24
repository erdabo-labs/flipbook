import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

function FieldWrapper({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-[#1A1A17]">{label}</span>}
      {children}
    </label>
  );
}

export function Input({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <FieldWrapper label={label}>
      <input
        className={`min-h-[50px] w-full rounded-[12px] border border-[#E3E0D7] bg-white px-3 py-2 text-base focus:border-[#047857] focus:outline-none ${className}`}
        {...props}
      />
    </FieldWrapper>
  );
}

export function Textarea({
  label,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <FieldWrapper label={label}>
      <textarea
        className={`min-h-22 w-full rounded-[12px] border border-[#E3E0D7] bg-white px-3 py-2 text-base focus:border-[#047857] focus:outline-none ${className}`}
        {...props}
      />
    </FieldWrapper>
  );
}

export function Select({
  label,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <FieldWrapper label={label}>
      <select
        className={`min-h-[50px] w-full rounded-[12px] border border-[#E3E0D7] bg-white px-3 py-2 text-base focus:border-[#047857] focus:outline-none ${className}`}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex min-h-[50px] w-full items-center justify-between rounded-[12px] border border-[#E3E0D7] bg-white px-3 py-2"
    >
      <span className="text-sm font-medium text-[#1A1A17]">{label}</span>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-[#047857]" : "bg-[#E3E0D7]"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
