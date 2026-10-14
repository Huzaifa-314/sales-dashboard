"use client";

import { toast } from "sonner";
import { formatMoney } from "@/components/app/money";
import { useT } from "@/components/app/preferences";
import type { Customer } from "@/lib/customers";
import { whatsappUrl } from "@/lib/whatsapp";

// The words and the action for chasing a customer, shared by the list, the
// customer page and Home so they always agree.
export function useReminders() {
  const t = useT();

  // "29 days late", only for accounts that are overdue.
  function lateText(c: Customer) {
    if (!c.overdueDays) return undefined;
    return c.overdueDays === 1
      ? t("cust.dayLate")
      : t("cust.daysLate", { count: c.overdueDays });
  }

  // Opens WhatsApp with a ready message: a firm one for overdue accounts, a
  // friendly one for anything else still outstanding.
  function remind(c: Customer) {
    if (!c.phone)
      return void toast.error(t("cust.noPhoneToast", { name: c.name }));
    if (c.outstanding <= 0)
      return void toast(t("cust.nothingOwed", { name: c.name }));
    const text =
      c.overdue > 0
        ? t("cust.waReminder", {
            name: c.name,
            amount: formatMoney(c.overdue),
            days: lateText(c) ?? "",
          })
        : t("cust.waFriendly", {
            name: c.name,
            amount: formatMoney(c.outstanding),
          });
    window.open(whatsappUrl(c.phone, text), "_blank", "noopener,noreferrer");
  }

  return { lateText, remind };
}
