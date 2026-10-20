import { describe, expect, it } from "vitest";
import { decryptJson, encryptJson } from "./export-crypto.mjs";

const PASS = "correct horse battery staple";
const data = { users: [{ email: "someone@example.com" }], graves: [{ name: "Secret private grave", is_public: false }] };

describe("export encryption", () => {
  it("round-trips the data", () => {
    expect(decryptJson(encryptJson(data, PASS), PASS)).toEqual(data);
  });

  it("never writes the plaintext (emails, private grave names) into the file", () => {
    const file = encryptJson(data, PASS).toString("latin1");
    expect(file).not.toContain("someone@example.com");
    expect(file).not.toContain("Secret private grave");
  });

  it("uses a fresh salt and IV every time", () => {
    expect(encryptJson(data, PASS).equals(encryptJson(data, PASS))).toBe(false);
  });

  it("rejects a wrong passphrase", () => {
    expect(() => decryptJson(encryptJson(data, PASS), "another passphrase!")).toThrow(/wrong passphrase/i);
  });

  it("detects a modified file", () => {
    const file = encryptJson(data, PASS);
    file[file.length - 1] ^= 0xff;
    expect(() => decryptJson(file, PASS)).toThrow(/wrong passphrase|corrupted/i);
  });

  it("refuses a file that isn't an export", () => {
    expect(() => decryptJson(Buffer.from("just some text that is long enough to pass length"), PASS)).toThrow(/not a burymyproject export/i);
    expect(() => decryptJson(Buffer.alloc(3), PASS)).toThrow(/not a burymyproject export/i);
  });

  it.each(["", "short", "12345678901"])("refuses a weak passphrase %j", (weak) => {
    expect(() => encryptJson(data, weak)).toThrow(/at least 12 characters/);
  });
});
