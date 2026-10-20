import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

// File layout: MAGIC | salt(16) | iv(12) | authTag(16) | ciphertext
// AES-256-GCM, key derived from the passphrase with scrypt. GCM authenticates
// the data, so a wrong passphrase or a modified file fails loudly on decrypt.
const MAGIC = Buffer.from("BMPX1");
const SALT_BYTES = 16;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const MIN_PASSPHRASE_LENGTH = 12;

function deriveKey(passphrase, salt) {
  return scryptSync(passphrase, salt, 32, { N: 2 ** 15, r: 8, p: 1, maxmem: 128 * 1024 * 1024 });
}

export function encryptJson(value, passphrase) {
  if (typeof passphrase !== "string" || passphrase.length < MIN_PASSPHRASE_LENGTH) {
    throw new Error(`The passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters long.`);
  }
  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(passphrase, salt), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([MAGIC, salt, iv, cipher.getAuthTag(), ciphertext]);
}

export function decryptJson(file, passphrase) {
  const headerLength = MAGIC.length + SALT_BYTES + IV_BYTES + TAG_BYTES;
  if (file.length <= headerLength || !file.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error("This is not a burymyproject export file.");
  }
  let offset = MAGIC.length;
  const salt = file.subarray(offset, (offset += SALT_BYTES));
  const iv = file.subarray(offset, (offset += IV_BYTES));
  const tag = file.subarray(offset, (offset += TAG_BYTES));
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(passphrase, salt), iv);
  decipher.setAuthTag(tag);
  try {
    const plain = Buffer.concat([decipher.update(file.subarray(offset)), decipher.final()]);
    return JSON.parse(plain.toString("utf8"));
  } catch {
    throw new Error("Wrong passphrase, or the file is corrupted.");
  }
}
