import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

function FieldWrapper({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-zinc-700">{label}</span>}
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
        className={`min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none ${className}`}
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
        className={`min-h-22 w-full rounded-lg border border-zinc-300 px-3 py-2 text-base focus:border-zinc-900 focus:outline-none ${className}`}
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
        className={`min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base focus:border-zinc-900 focus:outline-none ${className}`}
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
      className="flex min-h-11 w-full items-center justify-between rounded-lg border border-zinc-300 px-3 py-2"
    >
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-zinc-900" : "bg-zinc-300"
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
