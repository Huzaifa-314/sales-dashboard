import type { Metadata } from "next";
import { SignupForm } from "@/components/app/auth/signup-form";

export const metadata: Metadata = { title: "Create account · SalesPro" };

export default function SignupPage() {
  return <SignupForm />;
}
