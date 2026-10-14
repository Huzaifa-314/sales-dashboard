"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useResolvedTheme } from "@/components/app/preferences";
import { useMediaQuery } from "@/hooks/use-media-query";

// Toasts: dark ink pill with light text (inverse of the page), our radius and
// type. Pauses on hover and focus by itself. Call toast(...) from "sonner".
const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useResolvedTheme();
  // Bottom-right on desktop keeps the page header (and its buttons) clear. On a
  // phone the bottom holds the tab bar and the bulk bar, so toasts go on top.
  const desktop = useMediaQuery("(min-width: 1024px)");

  return (
    <Sonner
      theme={theme}
      position={desktop ? "bottom-right" : "top-center"}
      offset={{ bottom: 24, right: 32 }}
      mobileOffset={{ top: 64 }}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-[18px]" />,
        info: <InfoIcon className="size-[18px]" />,
        warning: <TriangleAlertIcon className="size-[18px]" />,
        error: <OctagonXIcon className="size-[18px]" />,
        loading: <Loader2Icon className="size-[18px] animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--primary)",
          "--normal-text": "var(--on-primary)",
          "--normal-border": "var(--primary)",
          "--border-radius": "10px",
          fontFamily: "inherit",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
