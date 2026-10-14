"use client";

import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/app/card";
import { EmptyState } from "@/components/app/empty-state";
import { navItemFor } from "@/components/app/nav";
import { PageHeader } from "@/components/app/page-header";
import { useT } from "@/components/app/preferences";
import { Button } from "@/components/ui/button";

// The page behind every navigation item that is not built yet, so a click never
// ends in a 404. Takes only the path: icons cannot cross from a server page.
export function ComingSoon({ href }: { href: string }) {
  const t = useT();
  const item = navItemFor(href);
  const name = item ? t(item.label) : href;
  return (
    <AppShell>
      <PageHeader title={name} />
      <Card className="mt-8">
        <EmptyState
          as="h2"
          title={t("nav.comingTitle")}
          description={t("nav.comingBody")}
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
