import type { Metadata } from "next";
import { LegalStub } from "@/components/app/auth/legal-stub";

export const metadata: Metadata = { title: "Terms · SalesPro" };

export default function Page() {
  return <LegalStub kind="terms" />;
}
