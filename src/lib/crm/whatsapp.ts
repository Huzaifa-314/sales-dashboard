export function cleanWhatsAppPhone(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^0-9]/g, "");

  if (cleaned.startsWith("0")) {
    cleaned = "60" + cleaned.slice(1);
  }

  return cleaned;
}

export function generateWhatsAppMessage(
  company: string,
  contact?: string | null,
  customText?: string,
): string {
  if (customText) return customText;
  const recipient = contact || company;
  return `Hello ${recipient}, this is regarding your invoice and billing workflow at ${company}. Do you have 2 minutes to connect?`;
}

export function generateWhatsAppUrl(
  phone?: string | null,
  company: string = "",
  contact?: string | null,
  customText?: string,
): string | null {
  if (!phone) return null;
  const cleanPhone = cleanWhatsAppPhone(phone);
  if (!cleanPhone) return null;

  const message = generateWhatsAppMessage(company, contact, customText);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
