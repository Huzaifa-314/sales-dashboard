import type { ReactNode } from "react";

// The buttons of a form page, in a bar that stays at the bottom of the screen
// while the form scrolls (above the tab bar on a phone). Primary action last.
export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-14 z-float -mx-4 mt-6 border-t border-line bg-surface px-4 py-3 lg:bottom-0 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {children}
      </div>
    </div>
  );
}
