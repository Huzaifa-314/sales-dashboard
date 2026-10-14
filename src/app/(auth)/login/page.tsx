import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/app/auth/login-form";

export const metadata: Metadata = { title: "Log in · SalesPro" };

// The form reads ?verified and ?reset from the address, which needs Suspense
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
