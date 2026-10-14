import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { PreferencesSync } from "@/components/app/preferences";
import { Providers } from "@/components/app/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// opsz: Newsreader redraws itself for large sizes, which is what makes the
// 36-44px hero figure look refined instead of merely enlarged.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "SalesPro CRM - Sales Pipeline & Acquisition Engine",
  description: "Multi-tenant B2B Sales Dashboard, Kanban Pipeline, and WhatsApp Outreach CRM.",
};

// Runs before first paint so there is no flash of the wrong theme or language.
// Keys must match src/components/app/preferences.tsx.
const preferenceScript = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("invoispro:theme");var dark=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);d.dataset.theme=dark?"dark":"light";if(localStorage.getItem("invoispro:lang")==="ms")d.lang="ms";}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferenceScript }} />
      </head>
      <body className="min-h-full">
        <PreferencesSync />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
