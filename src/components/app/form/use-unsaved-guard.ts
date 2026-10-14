"use client";

import { useEffect } from "react";

// While a form has unsaved changes, closing the tab or reloading asks first.
// (Leaving through the app's own Cancel button is handled by the form itself.)
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}
