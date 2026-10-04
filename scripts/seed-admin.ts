// Creates (or resets the password of) an admin. Writes .seed/admin.sql (git-ignored).
// Usage: npm run seed:admin      (prompts)   or   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed:admin
import { mkdirSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { ulid } from "ulidx";
import { hashPassword } from "../src/server/lib/crypto";

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

const rl = createInterface({ input: process.stdin, output: process.stdout });
const email = (process.env.ADMIN_EMAIL ?? (await rl.question("Admin email: "))).trim().toLowerCase();
const name = (process.env.ADMIN_NAME ?? (await rl.question("Admin name: "))).trim() || "Admin";
const password = process.env.ADMIN_PASSWORD ?? (await rl.question("Admin password (min 10 chars, visible while typing): "));
rl.close();

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Invalid email");
if (password.length < 10) throw new Error("Password must be at least 10 characters");

const hash = await hashPassword(password);
const now = new Date().toISOString();
const sql =
  `INSERT INTO users (id, email, name, role, password_hash, totp_secret, timezone, created_at) ` +
  `VALUES (${q(ulid())}, ${q(email)}, ${q(name)}, 'admin', ${q(hash)}, NULL, 'UTC', ${q(now)}) ` +
  `ON CONFLICT(email) DO UPDATE SET name = excluded.name, role = 'admin', password_hash = excluded.password_hash;\n`;

mkdirSync(".seed", { recursive: true });
writeFileSync(".seed/admin.sql", sql);
console.log(`admin.sql written for ${email}`);
