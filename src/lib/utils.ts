import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge must know our own type sizes, otherwise it reads
// "text-caption" as a colour and drops it when merged with "text-ink".
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["micro", "caption", "body"] }],
    },
  },
});

// Merge class names; later Tailwind classes win over earlier conflicting ones.
// Used by the shadcn components in components/ui.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
