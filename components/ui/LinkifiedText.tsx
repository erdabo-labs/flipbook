const LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;

export function LinkifiedText({ text, className = "" }: { text: string; className?: string }) {
  const parts: (string | { label: string; url: string })[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = LINK_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1] && match[2]) {
      parts.push({ label: match[1], url: match[2] });
    } else if (match[3]) {
      parts.push({ label: match[3], url: match[3] });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return (
    <span className={`break-words ${className}`}>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          part
        ) : (
          <a
            key={i}
            href={part.url}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-[#047857] underline"
          >
            {part.label}
          </a>
        )
      )}
    </span>
  );
}
