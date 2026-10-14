import type { Metadata } from "next";
import { DesignSystem } from "./design-system";

export const metadata: Metadata = {
  title: "Design system · InvoisPro",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return <DesignSystem />;
}
