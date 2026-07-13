// Bundles hq-src/ into site/hq/payload.json (plain JSON, no encryption)
// Usage: node tools/build-hq.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "hq-src");

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

writeFileSync(join(root, "site/hq/payload.json"), JSON.stringify({ v: 2, pages }));
console.log(`Bundled ${pages.length} pages -> site/hq/payload.json`);
