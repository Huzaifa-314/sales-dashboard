"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/app/preferences";
import { TextField } from "@/components/app/text-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addCustomer } from "@/lib/customers-store";
import type { Customer } from "@/lib/customers";

// Quick-add: a name and a phone number, nothing else (Design System, person
// picker). Everything else is filled in later on the customer's page.
export function AddCustomerDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (customer: Customer) => void;
}) {
  const t = useT();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const nameError = !name.trim() ? t("cust.errName") : undefined;
  // 9 to 12 digits covers local (012-345 6789) and international (+60 12…).
  const digits = phone.replace(/\D/g, "").length;
  const phoneError =
    phone.trim() && (digits < 9 || digits > 12)
      ? t("cust.errPhone")
      : undefined;

  function change(next: boolean) {
    if (!next) {
      setName("");
      setPhone("");
      setSubmitted(false);
    }
    onOpenChange(next);
  }

  // Carry what was typed to the full page, so nothing is typed twice
  function moreDetails() {
    const q = new URLSearchParams();
    if (name.trim()) q.set("name", name.trim());
    if (phone.trim()) q.set("phone", phone.trim());
    change(false);
    router.push(`/customers/new${q.size ? `?${q}` : ""}`);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (nameError || phoneError) return;
    const created = addCustomer({ name, phone });
    change(false);
    onCreated(created);
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent closeLabel={t("common.close")}>
        <DialogHeader>
          <DialogTitle>{t("cust.addTitle")}</DialogTitle>
          <DialogDescription>{t("cust.addDesc")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="grid gap-4">
          <TextField
            label={t("cust.fieldName")}
            value={name}
            onChange={setName}
            error={submitted ? nameError : undefined}
            autoComplete="off"
            required
          />
          <TextField
            label={t("cust.fieldPhone")}
            value={phone}
            onChange={setPhone}
            error={submitted ? phoneError : undefined}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="012-345 6789"
          />
          <DialogFooter className="mt-2">
            <Button
              variant="ghost"
              onClick={moreDetails}
              className="sm:mr-auto"
            >
              {t("cf.moreDetails")}
            </Button>
            <Button variant="secondary" onClick={() => change(false)}>
              {t("cust.cancel")}
            </Button>
            <Button type="submit">{t("cust.addSubmit")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
