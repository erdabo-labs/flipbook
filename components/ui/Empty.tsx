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
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center">
      <p className="font-medium text-zinc-700">{title}</p>
      {description && <p className="text-sm text-zinc-500">{description}</p>}
      {action}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
    </div>
  );
}
