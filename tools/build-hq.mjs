// Encrypts hq-src/ into site/hq/payload.json
// Usage: HQ_PASSWORD="..." node tools/build-hq.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "hq-src");
const password = process.env.HQ_PASSWORD;
if (!password) {
  console.error('Set HQ_PASSWORD, e.g. HQ_PASSWORD="secret" node tools/build-hq.mjs');
  process.exit(1);
}

// Page order & grouping for the sidebar. id = filename without .html
const NAV = [
  { group: "Plan · 计划", pages: ["overview", "case-file", "night-of", "run-sheet", "flavor", "props-checklist", "print-pack"] },
  { group: "Stations · 关卡", pages: [
    "roles/studio-stella", "roles/control-tan", "roles/archive-intern",
    "roles/newsroom-echo", "roles/greenroom-witness", "roles/rooftop-joe",
    "roles/office-reed",
  ]},
  { group: "Crew · 团队", pages: ["roles/hq-desk", "roles/emcee", "roles/floater"] },
];

function loadPage(id) {
  const raw = readFileSync(join(srcDir, id + ".html"), "utf8");
  const m = raw.match(/<!--\s*title:\s*(.*?)\s*-->/);
  return { id, title: m ? m[1] : id, html: raw };
}

const pages = NAV.flatMap(g => g.pages.map(id => ({ ...loadPage(id), group: g.group })));
// Warn about hq-src files not in NAV
const onDisk = [];
for (const f of readdirSync(srcDir, { recursive: true })) {
  if (String(f).endsWith(".html")) onDisk.push(String(f).replace(/\.html$/, "").replace(/\\/g, "/"));
}
for (const f of onDisk) if (!pages.some(p => p.id === f)) console.warn(`WARN: ${f}.html exists but is not in NAV`);

const plaintext = new TextEncoder().encode(JSON.stringify({ pages }));
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
  keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
);
const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext));

const b64 = (u8) => Buffer.from(u8).toString("base64");
writeFileSync(join(root, "site/hq/payload.json"), JSON.stringify({
  v: 1, kdf: "PBKDF2-SHA256", iter: 310000,
  salt: b64(salt), iv: b64(iv), data: b64(ciphertext),
}));
console.log(`Encrypted ${pages.length} pages -> site/hq/payload.json`);
