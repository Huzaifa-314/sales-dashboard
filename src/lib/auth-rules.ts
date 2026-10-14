// The checks behind the login and sign-up forms, as plain functions with no
// React in them, so they can be tested. Imports are type-only so this runs
// under `npm test`. Checks return message keys, not words.

export type LoginValues = { email: string; password: string };

export type SignupValues = {
  name: string;
  email: string;
  password: string;
  confirm: string;
  whatsapp: string;
  terms: boolean;
};

export const isEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

// The three password rules, so the form can tick them off as the person types
export function passwordChecks(v: string) {
  return {
    length: v.length >= 8,
    letter: /[A-Za-z]/.test(v),
    number: /\d/.test(v),
  };
}

// At least 8 characters, with a letter and a number
export const isStrongPassword = (v: string) =>
  Object.values(passwordChecks(v)).every(Boolean);

// A Malaysian mobile number in one form: +60123456789. Accepts 012-345 6789,
// 0123456789, 60123456789 and +60 12 345 6789. Returns null when it is not a
// mobile number (they start with 1 after the 0 or the country code).
export function normaliseMyMobile(v: string): string | null {
  let d = v.replace(/\D/g, "");
  if (d.startsWith("60")) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  return /^1\d{8,9}$/.test(d) ? `+60${d}` : null;
}

export type ResetValues = { password: string; confirm: string };
export function validateReset(v: ResetValues): {
  password?: string;
  confirm?: string;
} {
  const e: { password?: string; confirm?: string } = {};
  if (!isStrongPassword(v.password)) e.password = "auth.errPasswordRule";
  else if (v.confirm !== v.password) e.confirm = "auth.errMismatch";
  return e;
}

export function validateEmailOnly(email: string): { email?: string } {
  return isEmail(email) ? {} : { email: "auth.errEmail" };
}

export type LoginErrors = Partial<Record<"email" | "password", string>>;
export type SignupErrors = Partial<
  Record<
    "name" | "email" | "password" | "confirm" | "whatsapp" | "terms",
    string
  >
>;

export function validateLogin(v: LoginValues): LoginErrors {
  const e: LoginErrors = {};
  if (!isEmail(v.email)) e.email = "auth.errEmail";
  if (!v.password) e.password = "auth.errPasswordEmpty";
  return e;
}

export function validateSignup(v: SignupValues): SignupErrors {
  const e: SignupErrors = {};
  if (v.name.trim().length < 2) e.name = "auth.errName";
  if (!isEmail(v.email)) e.email = "auth.errEmail";
  if (!isStrongPassword(v.password)) e.password = "auth.errPasswordRule";
  else if (v.confirm !== v.password) e.confirm = "auth.errMismatch";
  if (!normaliseMyMobile(v.whatsapp)) e.whatsapp = "auth.errWhatsapp";
  if (!v.terms) e.terms = "auth.errTerms";
  return e;
}
