// Flippy avatar — calm emerald spark in a soft orb. Replaces the 🤖 emoji.
// Inline (next to text): <FlippyMark className="h-4 w-4" />
// Chat avatar:           <FlippyMark className="h-8 w-8" />

export function FlippyMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{
        background: "radial-gradient(circle at 35% 30%, #ECFDF5, #D6F3E6 70%)",
        boxShadow: "inset 0 0 0 1px #CDEEDE",
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" className="h-[62%] w-[62%]" fill="none">
        <path
          d="M24 4C25.6 13.8 28.4 16.6 38 18.2C28.4 19.8 25.6 22.6 24 32.4C22.4 22.6 19.6 19.8 10 18.2C19.6 16.6 22.4 13.8 24 4Z"
          fill="#047857"
        />
      </svg>
    </span>
  );
}
