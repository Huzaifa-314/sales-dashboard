"use client";

import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/app/card";
import { EmptyState } from "@/components/app/empty-state";
import { useT } from "@/components/app/preferences";
import { Button } from "@/components/ui/button";

// The branded 404: same frame as every page, one way back.
export default function NotFound() {
  const t = useT();
  return (
    <AppShell>
      <Card className="mt-8">
        <EmptyState
          as="h1"
          title={t("nav.notFoundTitle")}
          description={t("nav.notFoundBody")}
          action={
            <Button asChild>
              <Link href="/">{t("nav.backHome")}</Link>
            </Button>
          }
        />
      </Card>
    </AppShell>
  );
}
