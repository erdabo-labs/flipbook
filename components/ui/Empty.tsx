function BookMark() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 40 40" fill="none" stroke="#047857" strokeWidth={3} strokeLinejoin="round">
      <path d="M2 4c6-2.4 12-2.4 18 0v32c-6-2.4-12-2.4-18 0z" />
      <path d="M38 4c-6-2.4-12-2.4-18 0v32c6-2.4 12-2.4 18 0z" />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-[#E3E0D7] px-6 py-12 text-center">
      <BookMark />
      <p className="font-semibold text-[#1A1A17]">{title}</p>
      {description && <p className="text-sm text-[#8C887D]">{description}</p>}
      {action}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#ECEAE3] border-t-[#047857]" />
    </div>
  );
}
