import { AlertCircle } from "lucide-react";
import { Card } from "@/components/app/card";

// Something failed to load: say what, offer one way forward.
export function ErrorState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card as="div" role="alert" className="px-5 py-10">
      <div className="flex flex-col items-start gap-1 sm:items-center sm:text-center">
        <AlertCircle
          size={28}
          strokeWidth={1.5}
          aria-hidden
          className="mb-2 text-overdue"
        />
        <h2 className="font-serif t-empty text-ink">{title}</h2>
        <p className="max-w-sm text-body text-ink-soft">{description}</p>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </Card>
  );
}
