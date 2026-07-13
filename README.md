# NTLC 2026 — Activity Planning Hub

Planning hub for the 3-hour camp activity session. Deployed to GitHub Pages.

## Repo layout

| Path | What it is | Deployed? |
|---|---|---|
| `site/` | Everything that goes to GitHub Pages | ✅ |
| `site/index.html` | Public landing page (safe for anyone to see) | ✅ |
| `site/hq/` | Committee HQ — **password-gated, content encrypted**. Page source reveals nothing without the password. | ✅ |
| `site/props/` | Standalone in-game station apps. No links back to HQ, no readable answers (hashes only). | ✅ |
| `hq-src/` | Plaintext committee content (case file, scripts, role pages). **Never deployed.** | ❌ |
| `tools/build-hq.mjs` | Re-encrypts `hq-src/` into `site/hq/payload.json` | ❌ |

## Editing committee content

Edit the HTML fragments in `hq-src/` (one file per page; `roles/` has one per committee member), commit, push. The deploy workflow encrypts them automatically — `site/hq/payload.json` is generated in CI, never committed.

To preview locally: `HQ_PASSWORD="your-password" node tools/build-hq.mjs`, then serve `site/` (e.g. `npx serve site`).

## Deploying — one-time setup

1. Repo **Settings → Pages → Source: GitHub Actions**
2. Repo **Settings → Secrets and variables → Actions → New repository secret**: name `HQ_PASSWORD`, value = the committee password (share it privately; it is stored nowhere in this repo)
3. Merge to `main` — the workflow builds and deploys `site/` only.

## ⚠️ Access-control notes

- Campers can be given `site/props/...` URLs freely — those pages contain no spoilers and no navigation to anything else.
- The HQ payload is AES-GCM encrypted; without the password the deployed site leaks nothing.
- **However**: if this repo itself is public, anyone who finds the repo can read `hq-src/` in plaintext. Keep the repo private, or accept that risk.
