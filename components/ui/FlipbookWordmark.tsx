// Flipbook wordmark — FLIP (ink) + BOOK (emerald), per brand-assets/svg/flipbook-logo-horizontal.svg.
// Pass `reversed` on dark/emerald backgrounds (white + mint, per the -reversed lockup).

export function FlipbookWordmark({
  className = "text-[26px]",
  reversed = false,
}: {
  className?: string;
  reversed?: boolean;
}) {
  return (
    <span className={`font-extrabold tracking-[-0.035em] ${className}`}>
      <span className={reversed ? "text-white" : "text-[#1A1A17]"}>Flip</span>
      <span className={reversed ? "text-[#9FF0CD]" : "text-[#047857]"}>book</span>
    </span>
  );
}
