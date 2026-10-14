import type { ReactNode } from "react";

// The one surface: hairline border, card radius. `as` keeps landmarks honest.
export function Card({
  children,
  className = "",
  as: Tag = "section",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={`rounded-card border border-line bg-surface ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// A card with a titled header row (and optional trailing actions).
export function Section({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col">
      <div className="flex min-h-14 items-center justify-between gap-4 border-b border-line px-5">
        <h2 className="t-section">{title}</h2>
        {actions}
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </Card>
  );
}
