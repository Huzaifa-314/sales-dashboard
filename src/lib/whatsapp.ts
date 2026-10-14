// wa.me link with a ready message. Malaysian numbers are usually written
// locally ("012-345 6789"); WhatsApp wants the country code, so a leading 0
// becomes 60.
export function whatsappUrl(phone: string, text: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `60${digits.slice(1)}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
