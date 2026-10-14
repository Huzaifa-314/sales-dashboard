import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/app/coming-soon";
import { allNavItems } from "@/components/app/nav";

// Only the paths in the navigation get a "coming soon" page; anything else is a
// real 404. Next 16 passes the route params as a promise.
export default async function PlaceholderPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const href = `/${slug.join("/")}`;
  if (!allNavItems.some((i) => i.href === href)) notFound();
  return <ComingSoon href={href} />;
}
