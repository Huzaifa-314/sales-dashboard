import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normaliseMyMobile,
  validateLogin,
  validateSignup,
  validateReset,
  validateEmailOnly,
} from "../src/lib/auth-rules.ts";
import { mockLogin, mockSignup, mockResetPassword } from "../src/lib/auth-mock.ts";

test("Auth Suite: Malaysian phone number normalization", () => {
  assert.equal(normaliseMyMobile("012-345 6789"), "+60123456789");
  assert.equal(normaliseMyMobile("+60123456789"), "+60123456789");
  assert.equal(normaliseMyMobile("60123456789"), "+60123456789");
  assert.equal(normaliseMyMobile("011-1234 5678"), "+601112345678");
  assert.equal(normaliseMyMobile("012345678"), null); // Too short
  assert.equal(normaliseMyMobile("abcdefgh"), null);
});

test("Auth Suite: Login validation rules", () => {
  const empty = validateLogin({ email: "", password: "" });
  assert.equal(empty.email, "auth.errEmail");
  assert.equal(empty.password, "auth.errPasswordEmpty");

  const invalidEmail = validateLogin({ email: "invalid", password: "password123" });
  assert.equal(invalidEmail.email, "auth.errEmail");
  assert.equal(invalidEmail.password, undefined);

  const valid = validateLogin({ email: "founder@salesdashboard.my", password: "password123" });
  assert.equal(valid.email, undefined);
  assert.equal(valid.password, undefined);
});

test("Auth Suite: Signup validation and password strength", () => {
  const invalid = validateSignup({
    name: " ",
    email: "not-an-email",
    whatsapp: "123",
    password: "short",
    confirm: "short",
    terms: false,
  });

  assert.equal(invalid.name, "auth.errName");
  assert.equal(invalid.email, "auth.errEmail");
  assert.equal(invalid.whatsapp, "auth.errWhatsapp");
  assert.equal(invalid.password, "auth.errPasswordRule");
  assert.equal(invalid.terms, "auth.errTerms");

  const mismatch = validateSignup({
    name: "Aina",
    email: "aina@salesdashboard.my",
    whatsapp: "0123456789",
    password: "Password123",
    confirm: "Different123",
    terms: true,
  });
  assert.equal(mismatch.confirm, "auth.errMismatch");

  const valid = validateSignup({
    name: "Aina Rahman",
    email: "aina@salesdashboard.my",
    whatsapp: "012-345 6789",
    password: "Password123",
    confirm: "Password123",
    terms: true,
  });

  assert.deepEqual(valid, {});
});

test("Auth Suite: Password reset validation", () => {
  const emailErr = validateEmailOnly("bad-email");
  assert.equal(emailErr.email, "auth.errEmail");

  const emailOk = validateEmailOnly("user@company.com");
  assert.equal(emailOk.email, undefined);

  const resetMismatch = validateReset({
    password: "Password123",
    confirm: "Different123",
  });
  assert.equal(resetMismatch.confirm, "auth.errMismatch");

  const resetWeak = validateReset({
    password: "pass",
    confirm: "pass",
  });
  assert.equal(resetWeak.password, "auth.errPasswordRule");

  const resetValid = validateReset({
    password: "Password123",
    confirm: "Password123",
  });
  assert.deepEqual(resetValid, {});
});

test("Auth Suite: Mock auth state machine outcomes", async () => {
  // Existing check
  assert.equal(await mockSignup("taken@company.com"), "exists");
  assert.equal(await mockSignup("newuser@company.com"), "ok");

  // Reset outcome
  assert.equal(await mockResetPassword(), "ok");
});
