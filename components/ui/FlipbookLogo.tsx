// Flipbook logo mark — coin with the profit line climbing through it.
// Replaces the old open-book SVG. Use anywhere the wordmark sits beside it.

export function FlipbookLogo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      stroke="#047857"
      strokeWidth={2.8}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="13" />
      <path d="M16 27.5 L21 22.5 L24.5 25.5 L31 18.5" />
      <path d="M31 18.5 L26.2 18.5 M31 18.5 L31 23.3" />
    </svg>
  );
}
