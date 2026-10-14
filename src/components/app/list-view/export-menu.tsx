"use client";

import { Download, FileSpreadsheet, FileText, Table } from "lucide-react";
import { Menu, type MenuItem } from "@/components/app/menu";
import { useT } from "@/components/app/preferences";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ExportFormat = "csv" | "xlsx" | "pdf";

// The one Export button. In the toolbar it has a word beside the icon (icon
// only on a phone, with a name for screen readers); in the bulk bar it is small.
export function ExportMenu({
  onExport,
  heading,
  small = false,
}: {
  onExport: (format: ExportFormat) => void;
  // "Export 41 customers" / "Export 3 customers (selected)"
  heading: string;
  small?: boolean;
}) {
  const t = useT();
  const items: MenuItem[] = [
    {
      label: t("table.exportCsv"),
      icon: Table,
      onSelect: () => onExport("csv"),
    },
    {
      label: t("table.exportXlsx"),
      icon: FileSpreadsheet,
      onSelect: () => onExport("xlsx"),
    },
    {
      label: t("table.exportPdf"),
      icon: FileText,
      onSelect: () => onExport("pdf"),
    },
  ];
  return (
    <Menu
      label={t("table.exportMenu")}
      heading={heading}
      items={items}
      hint={small ? undefined : t("table.export")}
      triggerClassName={
        small
          ? buttonClass("secondary", "sm")
          : cn(buttonClass("secondary"), "max-md:size-11 max-md:px-0")
      }
    >
      <Download size={small ? 16 : 18} strokeWidth={1.5} aria-hidden />
      <span className={small ? undefined : "max-md:sr-only"}>
        {t("table.export")}
      </span>
    </Menu>
  );
}
