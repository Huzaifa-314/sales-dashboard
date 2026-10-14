import type { Metadata } from "next";
import { ForgotForm } from "@/components/app/auth/forgot-form";

export const metadata: Metadata = { title: "Reset password · SalesPro" };

export default function Page() {
  return <ForgotForm />;
}
