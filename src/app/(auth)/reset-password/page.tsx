import type { Metadata } from "next";
import { ResetForm } from "@/components/app/auth/reset-form";

export const metadata: Metadata = { title: "New password · SalesPro" };

export default function Page() {
  return <ResetForm />;
}
