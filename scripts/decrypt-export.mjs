/**
 * Decrypts a file produced by `npm run export`.
 * Usage: BACKUP_PASSPHRASE=... npm run export:decrypt -- <file> [--out file.json]
 * Without --out the JSON goes to stdout.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { decryptJson } from "./lib/export-crypto.mjs";

const file = process.argv[2];
const passphrase = process.env.BACKUP_PASSPHRASE;
if (!file || file.startsWith("--") || !passphrase) {
  console.error("Usage: BACKUP_PASSPHRASE=... npm run export:decrypt -- <file> [--out file.json]");
  process.exit(1);
}

let json;
try {
  json = JSON.stringify(decryptJson(readFileSync(file), passphrase), null, 2);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
const outIndex = process.argv.indexOf("--out");
if (outIndex > -1) {
  writeFileSync(process.argv[outIndex + 1], json, { mode: 0o600 });
  console.error(`Decrypted to ${process.argv[outIndex + 1]}`);
} else {
  console.log(json);
}
