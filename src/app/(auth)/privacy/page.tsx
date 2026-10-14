import type { Metadata } from "next";
import { LegalStub } from "@/components/app/auth/legal-stub";

export const metadata: Metadata = { title: "Privacy Policy · SalesPro" };

export default function Page() {
  return <LegalStub kind="privacy" />;
}
