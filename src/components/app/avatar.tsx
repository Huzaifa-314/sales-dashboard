function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 font-medium tracking-wide text-ink-soft ${
        size === "sm" ? "size-8 text-micro" : "size-10 text-caption"
      }`}
    >
      {initials(name)}
    </span>
  );
}
